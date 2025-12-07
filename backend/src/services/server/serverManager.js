import crypto from 'crypto';
import axios from 'axios';
import prisma from '../../config/prisma.js';
import logger from '../../utils/logger.js';

class ServerManager {
  constructor() {
    this.heartbeatInterval = 30000;
    this.healthCheckTimeout = 5000;
  }

  async registerServer(data) {
    try {
      const apiKey = crypto.randomBytes(32).toString('hex');
      const apiSecretPlain = crypto.randomBytes(32).toString('hex');

      const server = await prisma.server.create({
        data: {
          name: data.name,
          hostname: data.hostname,
          port: data.port || 443,
          type: data.type || 'SLAVE',
          apiKey,
          apiSecret: this._encrypt(apiSecretPlain),
          maxClients: data.maxClients || 1000,
          country: data.country,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          tags: data.tags || {},
          notes: data.notes
        }
      });

      logger.info(`Server registered: ${server.name} (${server.hostname})`);
      return { ...this._serializeServer(server), apiSecret: apiSecretPlain };
    } catch (error) {
      logger.error(`Register server error: ${error.message}`);
      throw error;
    }
  }

  async healthCheck(serverId) {
    try {
      const server = await prisma.server.findUnique({ where: { id: serverId } });
      if (!server) throw new Error('Server not found');

      const startTime = Date.now();
      try {
        const response = await axios.get(`https://${server.hostname}:${server.port}/api/health`, {
          timeout: this.healthCheckTimeout,
          headers: { 'X-API-Key': server.apiKey }
        });

        const responseTime = Date.now() - startTime;
        await prisma.server.update({
          where: { id: serverId },
          data: {
            status: 'ONLINE',
            lastHeartbeat: new Date(),
            responseTime,
            version: response.data.version,
            uptime: response.data.uptime,
            cpuUsage: response.data.cpu ?? server.cpuUsage,
            ramUsage: response.data.ram ?? server.ramUsage,
            diskUsage: response.data.disk ?? server.diskUsage,
            networkLoad: response.data.network ?? server.networkLoad
          }
        });

        return { status: 'ONLINE', responseTime, data: response.data };
      } catch (error) {
        await prisma.server.update({
          where: { id: serverId },
          data: { status: error.code === 'ETIMEDOUT' ? 'OFFLINE' : 'ERROR' }
        });
        return { status: 'OFFLINE', error: error.message };
      }
    } catch (error) {
      logger.error(`Health check error: ${error.message}`);
      throw error;
    }
  }

  async healthCheckAll() {
    try {
      const servers = await prisma.server.findMany();
      const results = await Promise.allSettled(servers.map((s) => this.healthCheck(s.id)));

      const summary = {
        total: servers.length,
        online: results.filter((r) => r.status === 'fulfilled' && r.value.status === 'ONLINE').length,
        offline: results.filter((r) => r.status === 'fulfilled' && r.value.status === 'OFFLINE').length,
        error: results.filter((r) => r.status === 'rejected').length
      };
      logger.info(`Health check: ${summary.online}/${summary.total} servers online`);
      return summary;
    } catch (error) {
      logger.error(`Health check all error: ${error.message}`);
      throw error;
    }
  }

  async getServerStats(serverId) {
    try {
      const server = await prisma.server.findUnique({
        where: { id: serverId },
        include: {
          inbounds: { include: { inbound: true } },
          clients: { include: { client: true } },
          _count: { select: { inbounds: true, clients: true } }
        }
      });
      if (!server) throw new Error('Server not found');

      const loadPercentage = server.maxClients > 0 ? Math.round((server.currentClients / server.maxClients) * 100) : 0;
      return {
        ...this._serializeServer(server),
        inboundCount: server._count.inbounds,
        clientCount: server._count.clients,
        loadPercentage,
        availableSlots: server.maxClients - server.currentClients
      };
    } catch (error) {
      logger.error(`Get server stats error: ${error.message}`);
      throw error;
    }
  }

  async updateServer(serverId, updates) {
    try {
      const server = await prisma.server.update({
        where: { id: serverId },
        data: {
          name: updates.name,
          hostname: updates.hostname,
          port: updates.port,
          maxClients: updates.maxClients,
          country: updates.country,
          city: updates.city,
          latitude: updates.latitude,
          longitude: updates.longitude,
          tags: updates.tags,
          notes: updates.notes
        }
      });
      logger.info(`Server updated: ${server.name}`);
      return this._serializeServer(server);
    } catch (error) {
      logger.error(`Update server error: ${error.message}`);
      throw error;
    }
  }

  async deleteServer(serverId) {
    try {
      const server = await prisma.server.findUnique({
        where: { id: serverId },
        include: { _count: { select: { clients: true } } }
      });
      if (!server) throw new Error('Server not found');
      if (server._count.clients > 0) throw new Error('Cannot delete server with active clients. Migrate clients first.');

      await prisma.server.delete({ where: { id: serverId } });
      logger.info(`Server deleted: ${server.name}`);
      return { message: 'Server deleted successfully' };
    } catch (error) {
      logger.error(`Delete server error: ${error.message}`);
      throw error;
    }
  }

  async getBestServer(criteria = {}) {
    try {
      const servers = await prisma.server.findMany({
        where: {
          status: 'ONLINE',
          type: 'SLAVE',
          ...(criteria.country ? { country: criteria.country } : {})
        }
      });
      if (servers.length === 0) throw new Error('No available servers');

      const scored = servers.map((s) => {
        const loadScore = 100 - Math.min(100, (s.currentClients / Math.max(s.maxClients, 1)) * 100);
        const latencyScore = s.responseTime ? 100 - Math.min(s.responseTime / 10, 100) : 50;
        const resourceScore = 100 - Math.min((s.cpuUsage + s.ramUsage) / 2, 100);
        const totalScore = loadScore * 0.5 + latencyScore * 0.3 + resourceScore * 0.2;
        return { server: s, score: totalScore };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored[0].server;
    } catch (error) {
      logger.error(`Get best server error: ${error.message}`);
      throw error;
    }
  }

  async assignClientToServer(clientId, serverId = null) {
    try {
      if (!serverId) {
        serverId = (await this.getBestServer()).id;
      }

      const existing = await prisma.serverClient.findUnique({
        where: { serverId_clientId: { serverId, clientId } }
      });
      if (existing) return existing;

      const assignment = await prisma.serverClient.create({ data: { serverId, clientId } });
      await prisma.server.update({ where: { id: serverId }, data: { currentClients: { increment: 1 } } });
      logger.info(`Client ${clientId} assigned to server ${serverId}`);
      return assignment;
    } catch (error) {
      logger.error(`Assign client error: ${error.message}`);
      throw error;
    }
  }

  async migrateClient(clientId, fromServerId, toServerId) {
    try {
      await prisma.serverClient.delete({ where: { serverId_clientId: { serverId: fromServerId, clientId } } });
      await prisma.server.update({ where: { id: fromServerId }, data: { currentClients: { decrement: 1 } } });
      await this.assignClientToServer(clientId, toServerId);
      logger.info(`Client ${clientId} migrated: ${fromServerId} -> ${toServerId}`);
      return { message: 'Client migrated successfully' };
    } catch (error) {
      logger.error(`Migrate client error: ${error.message}`);
      throw error;
    }
  }

  async autoBalance() {
    try {
      const servers = await prisma.server.findMany({
        where: { status: 'ONLINE', type: 'SLAVE' },
        include: { clients: true }
      });
      if (servers.length < 2) return { message: 'Need at least 2 servers for balancing' };

      const totalClients = servers.reduce((sum, s) => sum + s.currentClients, 0);
      const avgLoad = totalClients / servers.length || 0;
      let migratedCount = 0;

      for (const server of servers) {
        if (server.currentClients > avgLoad * 1.2) {
          const excess = Math.floor(server.currentClients - avgLoad);
          const target = servers.find((s) => s.id !== server.id && s.currentClients < avgLoad * 0.8);
          if (target) {
            const clientsToMigrate = server.clients.slice(0, excess);
            for (const assignment of clientsToMigrate) {
              await this.migrateClient(assignment.clientId, server.id, target.id);
              migratedCount += 1;
            }
          }
        }
      }
      logger.info(`Auto-balance completed: ${migratedCount} clients migrated`);
      return { migratedCount };
    } catch (error) {
      logger.error(`Auto-balance error: ${error.message}`);
      throw error;
    }
  }

  async syncConfigToServer(serverId) {
    try {
      const server = await prisma.server.findUnique({
        where: { id: serverId },
        include: {
          inbounds: {
            include: {
              inbound: { include: { clients: true } }
            }
          }
        }
      });
      if (!server) throw new Error('Server not found');

      const config = {
        inbounds: server.inbounds.map((si) => si.inbound),
        timestamp: new Date().toISOString()
      };

      await axios.post(`https://${server.hostname}:${server.port}/api/config/sync`, config, {
        headers: { 'X-API-Key': server.apiKey },
        timeout: 10000
      });

      await prisma.server.update({
        where: { id: serverId },
        data: { lastSyncAt: new Date(), configVersion: crypto.randomBytes(8).toString('hex') }
      });

      logger.info(`Config synced to server: ${server.name}`);
      return { message: 'Config synced successfully' };
    } catch (error) {
      logger.error(`Sync config error: ${error.message}`);
      throw error;
    }
  }

  _encrypt(text) {
    return Buffer.from(text).toString('base64');
  }

  _serializeServer(server) {
    const toStr = (v) => (typeof v === 'bigint' ? v.toString() : v);
    return {
      ...server,
      totalUp: toStr(server.totalUp),
      totalDown: toStr(server.totalDown)
    };
  }
}

const serverManager = new ServerManager();
export default serverManager;

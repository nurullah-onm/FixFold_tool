import crypto from 'crypto';
import prisma from '../../config/prisma.js';
import logger from '../../utils/logger.js';
import inboundService from '../inbound/inboundService.js';

const createError = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const toBigInt = (value, fallback = 0n) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string') return BigInt(value);
  return fallback;
};

class ClientService {
  async createClient(userId, userRole, inboundId, data) {
    try {
      const inbound = await this._getInboundForUser(inboundId, userId, userRole);
      await this._ensureEmailUnique(inboundId, data.email);

      const credentials = this._generateCredentials(inbound.protocol, data);
      const client = await prisma.client.create({
        data: {
          inboundId,
          email: data.email,
          ...credentials,
          totalGB: toBigInt(data.totalGB, 0n),
          expiryTime: data.expiryTime ? new Date(data.expiryTime) : null,
          limitIp: data.limitIp ?? 0,
          tgId: data.tgId || null,
          reset: data.reset ?? 0,
          enable: data.enable !== false
        }
      });

      await this._syncInboundClients(inboundId);
      logger.info(`Client created: ${client.email} in inbound ${inbound.remark}`);
      return this._serializeClient(client);
    } catch (error) {
      logger.error(`Create client error: ${error.message}`);
      throw error;
    }
  }

  async bulkCreateClients(userId, userRole, inboundId, count, template = {}) {
    try {
      const inbound = await this._getInboundForUser(inboundId, userId, userRole);
      const clients = [];
      for (let i = 0; i < count; i++) {
        const email = template.emailPrefix
          ? `${template.emailPrefix}_${i + 1}@bulk.local`
          : `client_${Date.now()}_${i}@bulk.local`;
        const credentials = this._generateCredentials(inbound.protocol, {});
        clients.push({
          inboundId,
          email,
          ...credentials,
          totalGB: toBigInt(template.totalGB, 0n),
          expiryTime: template.expiryTime ? new Date(template.expiryTime) : null,
          limitIp: template.limitIp ?? 0,
          reset: template.reset ?? 0,
          enable: true,
          subId: crypto.randomBytes(16).toString('hex')
        });
      }

      const created = await prisma.client.createMany({
        data: clients,
        skipDuplicates: true
      });

      await this._syncInboundClients(inboundId);
      logger.info(`Bulk created ${created.count} clients in inbound ${inbound.remark}`);
      return { count: created.count, clients: clients.map((c) => this._serializeClient(c)) };
    } catch (error) {
      logger.error(`Bulk create error: ${error.message}`);
      throw error;
    }
  }

  async getClients(userId, userRole, filters = {}) {
    try {
      const { inboundId, search, enable, expired, page = 1, limit = 20 } = filters;
      const where = {};

      if (inboundId) {
        await this._getInboundForUser(inboundId, userId, userRole);
        where.inboundId = inboundId;
      } else if (userRole !== 'ADMIN') {
        const userInbounds = await prisma.inbound.findMany({
          where: { userId },
          select: { id: true }
        });
        where.inboundId = { in: userInbounds.map((i) => i.id) };
      }

      if (search) where.email = { contains: search, mode: 'insensitive' };
      if (enable !== undefined) where.enable = enable === 'true' || enable === true;

      if (expired === 'true') {
        where.expiryTime = { lte: new Date() };
      } else if (expired === 'false') {
        where.OR = [{ expiryTime: null }, { expiryTime: { gt: new Date() } }];
      }

      const [clients, total] = await Promise.all([
        prisma.client.findMany({
          where,
          include: {
            inbound: { select: { id: true, remark: true, protocol: true, port: true, userId: true } }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.client.count({ where })
      ]);

      return {
        clients: clients.map((c) => this._serializeClient(c)),
        total,
        page: Number(page),
        pages: Math.ceil(total / limit) || 1
      };
    } catch (error) {
      logger.error(`Get clients error: ${error.message}`);
      throw error;
    }
  }

  async getClientById(id, userId, userRole) {
    try {
      const client = await prisma.client.findUnique({
        where: { id },
        include: {
          inbound: { include: { user: { select: { id: true, username: true, role: true } } } }
        }
      });
      if (!client) throw createError('Client not found', 404);
      if (userRole !== 'ADMIN' && client.inbound.userId !== userId) throw createError('Permission denied', 403);
      return this._serializeClient(client);
    } catch (error) {
      logger.error(`Get client error: ${error.message}`);
      throw error;
    }
  }

  async updateClient(id, userId, userRole, updates) {
    try {
      const client = await prisma.client.findUnique({
        where: { id },
        include: { inbound: true }
      });
      if (!client) throw createError('Client not found', 404);
      if (userRole !== 'ADMIN' && client.inbound.userId !== userId) throw createError('Permission denied', 403);

      const updated = await prisma.client.update({
        where: { id },
        data: {
          email: updates.email,
          totalGB: updates.totalGB !== undefined ? toBigInt(updates.totalGB) : undefined,
          expiryTime: updates.expiryTime ? new Date(updates.expiryTime) : undefined,
          limitIp: updates.limitIp,
          enable: updates.enable,
          tgId: updates.tgId,
          reset: updates.reset,
          flow: updates.flow,
          password: updates.password,
          uuid: updates.uuid
        }
      });

      await this._syncInboundClients(client.inboundId);
      logger.info(`Client updated: ${updated.email}`);
      return this._serializeClient(updated);
    } catch (error) {
      logger.error(`Update client error: ${error.message}`);
      throw error;
    }
  }

  async deleteClient(id, userId, userRole) {
    try {
      const client = await prisma.client.findUnique({
        where: { id },
        include: { inbound: true }
      });
      if (!client) throw createError('Client not found', 404);
      if (userRole !== 'ADMIN' && client.inbound.userId !== userId) throw createError('Permission denied', 403);

      await prisma.client.delete({ where: { id } });
      await this._syncInboundClients(client.inboundId);
      logger.info(`Client deleted: ${client.email}`);
      return { message: 'Client deleted successfully' };
    } catch (error) {
      logger.error(`Delete client error: ${error.message}`);
      throw error;
    }
  }

  async toggleClient(id, userId, userRole) {
    try {
      const client = await prisma.client.findUnique({
        where: { id },
        include: { inbound: true }
      });
      if (!client) throw createError('Client not found', 404);
      if (userRole !== 'ADMIN' && client.inbound.userId !== userId) throw createError('Permission denied', 403);

      const updated = await prisma.client.update({
        where: { id },
        data: { enable: !client.enable }
      });
      await this._syncInboundClients(client.inboundId);
      logger.info(`Client toggled: ${client.email} -> ${updated.enable}`);
      return { enable: updated.enable };
    } catch (error) {
      logger.error(`Toggle client error: ${error.message}`);
      throw error;
    }
  }

  async resetClientTraffic(id, userId, userRole) {
    try {
      const client = await prisma.client.findUnique({
        where: { id },
        include: { inbound: true }
      });
      if (!client) throw createError('Client not found', 404);
      if (userRole !== 'ADMIN' && client.inbound.userId !== userId) throw createError('Permission denied', 403);

      await prisma.client.update({
        where: { id },
        data: { up: 0n, down: 0n }
      });
      logger.info(`Client traffic reset: ${client.email}`);
      return { message: 'Traffic reset successfully' };
    } catch (error) {
      logger.error(`Reset traffic error: ${error.message}`);
      throw error;
    }
  }

  async getClientStats(id, userId, userRole) {
    try {
      const client = await prisma.client.findUnique({
        where: { id },
        include: { inbound: true }
      });
      if (!client) throw createError('Client not found', 404);
      if (userRole !== 'ADMIN' && client.inbound.userId !== userId) throw createError('Permission denied', 403);

      const total = client.up + client.down;
      const remaining = client.totalGB > 0 ? client.totalGB - total : null;
      const usagePercent = client.totalGB > 0 ? Number((total * 100n) / client.totalGB) : 0;
      const daysUntilExpiry = client.expiryTime
        ? Math.ceil((client.expiryTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        up: client.up.toString(),
        down: client.down.toString(),
        total: total.toString(),
        totalGB: client.totalGB.toString(),
        remaining: remaining ? remaining.toString() : null,
        usagePercent,
        expiryTime: client.expiryTime,
        daysUntilExpiry,
        isExpired: client.expiryTime ? client.expiryTime < new Date() : false,
        enable: client.enable
      };
    } catch (error) {
      logger.error(`Get client stats error: ${error.message}`);
      throw error;
    }
  }

  async checkExpiredClients() {
    try {
      const now = new Date();
      const expired = await prisma.client.updateMany({
        where: { expiryTime: { lte: now }, enable: true },
        data: { enable: false }
      });

      const overLimit = await prisma.client.findMany({
        where: { totalGB: { gt: 0 }, enable: true }
      });

      let disabledCount = 0;
      for (const client of overLimit) {
        const total = client.up + client.down;
        if (total >= client.totalGB) {
          await prisma.client.update({ where: { id: client.id }, data: { enable: false } });
          disabledCount += 1;
        }
      }

      if (expired.count > 0 || disabledCount > 0) {
        const affectedInbounds = await prisma.client.findMany({
          where: { enable: false, OR: [{ expiryTime: { lte: now } }, { totalGB: { gt: 0 } }] },
          select: { inboundId: true },
          distinct: ['inboundId']
        });
        for (const { inboundId } of affectedInbounds) {
          await this._syncInboundClients(inboundId);
        }
      }

      logger.info(`Expired clients: ${expired.count}, over-limit: ${disabledCount}`);
      return { expiredCount: expired.count, overLimitCount: disabledCount };
    } catch (error) {
      logger.error(`Check expired clients error: ${error.message}`);
      throw error;
    }
  }

  _generateCredentials(protocol, data) {
    switch (protocol) {
      case 'VMESS':
      case 'VLESS':
        return {
          uuid: data.uuid || crypto.randomUUID(),
          flow: data.flow || (protocol === 'VLESS' ? 'xtls-rprx-vision' : null)
        };
      case 'TROJAN':
      case 'SHADOWSOCKS':
        return {
          password: data.password || crypto.randomBytes(16).toString('hex')
        };
      default:
        return {};
    }
  }

  async _syncInboundClients(inboundId) {
    const inbound = await prisma.inbound.findUnique({
      where: { id: inboundId },
      include: { clients: { where: { enable: true } } }
    });
    if (!inbound) return;

    const clientConfigs = inbound.clients.map((c) => {
      switch (inbound.protocol) {
        case 'VMESS':
        case 'VLESS':
          return {
            id: c.uuid,
            email: c.email,
            flow: c.flow || ''
          };
        case 'TROJAN':
          return {
            password: c.password,
            email: c.email
          };
        case 'SHADOWSOCKS':
          return {
            password: c.password,
            email: c.email,
            method: inbound.settings?.method || 'aes-256-gcm'
          };
        default:
          return { email: c.email };
      }
    });

    await prisma.inbound.update({
      where: { id: inboundId },
      data: {
        settings: {
          ...inbound.settings,
          clients: clientConfigs
        }
      }
    });

    await inboundService._syncXrayConfig();
    logger.info(`Synced ${clientConfigs.length} clients for inbound ${inbound.remark}`);
  }

  async _ensureEmailUnique(inboundId, email) {
    const existing = await prisma.client.findUnique({
      where: { inboundId_email: { inboundId, email } }
    });
    if (existing) throw createError('Client email already exists in this inbound', 409);
  }

  async _getInboundForUser(inboundId, userId, userRole) {
    const inbound = await prisma.inbound.findUnique({ where: { id: inboundId } });
    if (!inbound) throw createError('Inbound not found', 404);
    if (userRole !== 'ADMIN' && inbound.userId !== userId) {
      throw createError('Permission denied', 403);
    }
    return inbound;
  }

  _serializeClient(client) {
    const toStr = (v) => (typeof v === 'bigint' ? v.toString() : v);
    const up = toBigInt(client.up || 0n);
    const down = toBigInt(client.down || 0n);
    const totalGB = toBigInt(client.totalGB || 0n);
    return {
      ...client,
      up: toStr(up),
      down: toStr(down),
      totalGB: toStr(totalGB),
      total: toStr(up + down)
    };
  }
}

const clientService = new ClientService();
export default clientService;

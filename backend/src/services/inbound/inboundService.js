import prisma from '../../config/prisma.js';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';
import xrayManager from '../xray/xrayManager.js';
import * as configBuilder from '../xray/configBuilder.js';
import * as xrayConfigService from '../xray/xrayConfigService.js';
import * as xrayStatsService from '../xray/xrayStatsService.js';
import {
  getVMessDefaults,
  getVLESSDefaults,
  getTrojanDefaults,
  getShadowsocksDefaults,
  getStreamPresets
} from './protocolHelpers.js';

const createError = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

class InboundService {
  async createInbound(userId, data) {
    const {
      remark,
      protocol,
      port,
      listen = '0.0.0.0',
      tag,
      settings = {},
      network = 'TCP',
      security = 'NONE',
      streamSettings,
      tlsSettings,
      realitySettings,
      sniffing,
      allocate
    } = data;

    const finalTag = tag || `inbound-${port}`;

    await this._validatePortAvailability(port);
    await this._validateTagUniqueness(finalTag);
    const mergedSettings = this._validateSettings(protocol, settings);
    const normalizedNetwork = network || 'TCP';
    const normalizedSecurity = security || 'NONE';
    const stream = streamSettings || getStreamPresets(normalizedNetwork, normalizedSecurity);

    const inbound = await prisma.inbound.create({
      data: {
        userId,
        remark,
        protocol,
        port,
        listen,
        tag: finalTag,
        settings: mergedSettings,
        network: normalizedNetwork,
        security: normalizedSecurity,
        streamSettings: stream,
        tlsSettings: tlsSettings || null,
        realitySettings: realitySettings || null,
        sniffing: sniffing || null,
        allocate: allocate || null,
        isActive: typeof data.isActive === 'boolean' ? data.isActive : true
      }
    });

    await this._syncXrayConfig();
    logger.info(`Inbound created: ${remark} on port ${port}`);
    return inbound;
  }

  async getInbounds(userId, filters = {}) {
    const { protocol, isActive, search, page = 1, limit = 10 } = filters;
    const where = {};
    if (userId) where.userId = userId;
    if (protocol) where.protocol = protocol;
    if (typeof isActive === 'boolean') where.isActive = isActive;
    if (search) where.remark = { contains: search, mode: 'insensitive' };

    const [total, inbounds] = await Promise.all([
      prisma.inbound.count({ where }),
      prisma.inbound.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { clients: true } } }
      })
    ]);

    const pages = Math.ceil(total / limit) || 1;
    const enriched = inbounds.map((i) => ({
      ...i,
      totalTraffic: BigInt(i.up || 0) + BigInt(i.down || 0)
    }));
    return { inbounds: enriched, total, page, pages };
  }

  async getInboundById(id, userId) {
    const inbound = await prisma.inbound.findUnique({
      where: { id },
      include: { clients: true }
    });
    if (!inbound) throw createError('Inbound not found', 404);
    if (userId && inbound.userId !== userId) throw createError('Forbidden', 403);
    return inbound;
  }

  async getInboundStats(id) {
    const inbound = await prisma.inbound.findUnique({ where: { id } });
    if (!inbound) throw createError('Inbound not found', 404);
    const stats = await xrayStatsService.getInboundStats(inbound.tag).catch(() => null);
    const clientAgg = await prisma.client.aggregate({
      where: { inboundId: id },
      _sum: { up: true, down: true },
      _count: { id: true }
    });
    const activeClients = await prisma.client.count({ where: { inboundId: id, enable: true } });

    return {
      up: inbound.up,
      down: inbound.down,
      realtime: stats,
      clientCount: clientAgg._count?.id || 0,
      activeClients,
      total: (clientAgg._sum.up || 0n) + (clientAgg._sum.down || 0n)
    };
  }

  async updateInbound(id, userId, data) {
    const inbound = await prisma.inbound.findUnique({ where: { id } });
    if (!inbound) throw createError('Inbound not found', 404);
    if (userId && inbound.userId !== userId) throw createError('Forbidden', 403);

    if (data.port && data.port !== inbound.port) {
      await this._validatePortAvailability(data.port, id);
    }
    if (data.tag && data.tag !== inbound.tag) {
      await this._validateTagUniqueness(data.tag, id);
    }

    let settings = data.settings || inbound.settings;
    if (data.protocol || data.settings) {
      settings = this._validateSettings(data.protocol || inbound.protocol, settings);
    }

    const updated = await prisma.inbound.update({
      where: { id },
      data: {
        ...data,
        settings
      }
    });

    await this._syncXrayConfig();
    logger.info(`Inbound updated: ${updated.remark}`);
    return updated;
  }

  async toggleInbound(id, userId) {
    const inbound = await prisma.inbound.findUnique({ where: { id } });
    if (!inbound) throw createError('Inbound not found', 404);
    if (userId && inbound.userId !== userId) throw createError('Forbidden', 403);

    const updated = await prisma.inbound.update({
      where: { id },
      data: { isActive: !inbound.isActive }
    });
    await this._syncXrayConfig();
    return { isActive: updated.isActive };
  }

  async deleteInbound(id, userId) {
    const inbound = await prisma.inbound.findUnique({
      where: { id },
      include: { clients: true }
    });
    if (!inbound) throw createError('Inbound not found', 404);
    if (userId && inbound.userId !== userId) throw createError('Forbidden', 403);
    if (inbound.clients?.length) {
      throw createError('Inbound has clients; delete or migrate clients first', 400);
    }

    await prisma.inbound.delete({ where: { id } });
    await this._syncXrayConfig();
    logger.info(`Inbound deleted: ${inbound.remark}`);
    return true;
  }

  async restartInbound(id, userId) {
    const inbound = await prisma.inbound.findUnique({ where: { id } });
    if (!inbound) throw createError('Inbound not found', 404);
    if (userId && inbound.userId !== userId) throw createError('Forbidden', 403);
    await xrayManager.reloadConfig();
    return true;
  }

  async syncTrafficFromXray() {
    const inbounds = await prisma.inbound.findMany({ where: { isActive: true } });
    let count = 0;
    for (const inbound of inbounds) {
      try {
        const stats = await xrayStatsService.getInboundStats(inbound.tag);
        const uplink = this._extractTraffic(stats, 'uplink');
        const downlink = this._extractTraffic(stats, 'downlink');
        await prisma.inbound.update({
          where: { id: inbound.id },
          data: {
            up: uplink,
            down: downlink
          }
        });
        count += 1;
      } catch (err) {
        logger.error(`Traffic sync failed for ${inbound.tag}: ${err.message}`);
      }
    }
    return count;
  }

  _extractTraffic(stats, direction) {
    if (!stats) return 0n;
    const statArr = stats?.stat || [];
    const found = statArr.find((s) => s.name?.toLowerCase().includes(direction));
    try {
      if (found?.value !== undefined) {
        return BigInt(found.value);
      }
    } catch (err) {
      logger.error(`Failed to parse traffic stats: ${err.message}`);
    }
    return 0n;
  }

  async _validatePortAvailability(port, excludeId) {
    if (port < 1 || port > 65535) {
      throw createError('Port aralığı geçersiz (1-65535)', 400);
    }
    const existing = await prisma.inbound.findFirst({
      where: {
        port,
        NOT: excludeId ? { id: excludeId } : undefined
      }
    });
    if (existing) {
      const message = `Port ${port} zaten kullanımda`;
      throw createError(message, 409);
    }
    return true;
  }

  async _validateTagUniqueness(tag, excludeId) {
    if (!tag) return true;
    const existing = await prisma.inbound.findFirst({
      where: {
        tag,
        NOT: excludeId ? { id: excludeId } : undefined
      }
    });
    if (existing) {
      throw createError('Tag already in use', 409);
    }
    return true;
  }

  _validateSettings(protocol, settings) {
    const proto = protocol.toUpperCase();
    switch (proto) {
      case 'VMESS': {
        const defaults = getVMessDefaults();
        return { ...defaults, ...settings };
      }
      case 'VLESS': {
        const defaults = getVLESSDefaults();
        return { ...defaults, ...settings };
      }
      case 'TROJAN': {
        const defaults = getTrojanDefaults();
        return { ...defaults, ...settings };
      }
      case 'SHADOWSOCKS': {
        const defaults = getShadowsocksDefaults();
        const merged = { ...defaults, ...settings };
        if (!merged.password) throw createError('Shadowsocks password required', 400);
        return merged;
      }
      default:
        return settings;
    }
  }

  _buildInboundConfig(inbound) {
    const security = inbound.security?.toLowerCase() || 'none';
    const sniff = inbound.sniffing || configBuilder.buildSniffing(true, ['http', 'tls', 'quic']);
    const baseStream = inbound.streamSettings && Object.keys(inbound.streamSettings).length > 0
      ? inbound.streamSettings
      : getStreamPresets(inbound.network, inbound.security);
    const streamWithSecurity = { ...baseStream, security };
    if (security === 'tls' && inbound.tlsSettings) {
      streamWithSecurity.tlsSettings = inbound.tlsSettings;
    }
    if (security === 'reality' && inbound.realitySettings) {
      streamWithSecurity.realitySettings = inbound.realitySettings;
    }
    // Proxy protocol / sockopt
    if (inbound.settings?.proxyProtocol) {
      streamWithSecurity.proxyProtocol = true;
    }
    if (inbound.settings?.sockopt) {
      streamWithSecurity.sockopt = inbound.settings.sockopt;
    }
    // WS/HTTP obfuscation (path/host)
    if (inbound.network === 'WS') {
      const host = inbound.settings?.httpObfuscation?.host;
      const path = inbound.settings?.httpObfuscation?.path || '/';
      streamWithSecurity.wsSettings = {
        ...(streamWithSecurity.wsSettings || {}),
        path,
        headers: host ? { Host: host } : undefined
      };
    }

    const common = {
      tag: inbound.tag,
      listen: inbound.listen,
      clients: inbound.settings?.clients || [],
      streamSettings: streamWithSecurity,
      sniffing: sniff
    };

    switch (inbound.protocol) {
      case 'VMESS':
        return configBuilder.buildVMessInbound(inbound.port, {
          ...common,
          settings: inbound.settings
        });
      case 'VLESS':
        return configBuilder.buildVLESSInbound(inbound.port, {
          ...common,
          settings: {
            decryption: inbound.settings?.decryption || 'none',
            ...inbound.settings
          }
        });
      case 'TROJAN':
        return configBuilder.buildTrojanInbound(inbound.port, {
          ...common,
          settings: inbound.settings,
          streamSettings: streamWithSecurity
        });
      case 'SHADOWSOCKS':
        return configBuilder.buildShadowsocksInbound(inbound.port, {
          tag: inbound.tag,
          listen: inbound.listen,
          ...inbound.settings
        });
      default:
        return null;
    }
  }

  async _syncXrayConfig() {
    const activeInbounds = await prisma.inbound.findMany({ where: { isActive: true } });
    const inboundConfigs = activeInbounds
      .map((i) => this._buildInboundConfig(i))
      .filter(Boolean);

    let config = await xrayConfigService.getActiveConfig();
    if (!config) {
      const base = configBuilder.generateFullConfig([], configBuilder.buildRouting([]));
      config = await prisma.xrayConfig.create({ data: { ...base, isActive: true } });
    }

    const updatedData = {
      inbounds: inboundConfigs,
      outbounds: config.outbounds || configBuilder.buildOutbounds(),
      routing: config.routing || configBuilder.buildRouting([])
    };

    await prisma.xrayConfig.update({
      where: { id: config.id },
      data: updatedData
    });

    const updated = { ...config, ...updatedData };

    await xrayConfigService.writeConfigFile(updated);
    await xrayManager.testConfig(env.xray.configPath);
    await xrayManager.reloadConfig();
  }
}

const inboundService = new InboundService();
export default inboundService;

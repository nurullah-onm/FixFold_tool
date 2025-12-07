import prisma from '../config/prisma.js';
import serverManager from '../services/server/serverManager.js';

const serializeServer = (server) => {
  if (!server) return server;
  const toStr = (v) => (typeof v === 'bigint' ? v.toString() : v);
  return {
    ...server,
    totalUp: toStr(server.totalUp),
    totalDown: toStr(server.totalDown)
  };
};

export const listServers = async (req, res, next) => {
  try {
    const servers = await prisma.server.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { clients: true, inbounds: true } } }
    });
    return res.json({
      success: true,
      data: servers.map((s) => ({ ...serializeServer(s), counts: s._count }))
    });
  } catch (error) {
    return next(error);
  }
};

export const getServer = async (req, res, next) => {
  try {
    const server = await prisma.server.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { clients: true, inbounds: true } } }
    });
    if (!server) return res.status(404).json({ success: false, error: 'Not found' });
    return res.json({ success: true, data: { ...serializeServer(server), counts: server._count } });
  } catch (error) {
    return next(error);
  }
};

export const createServer = async (req, res, next) => {
  try {
    const server = await serverManager.registerServer(req.body);
    return res.status(201).json({ success: true, data: server });
  } catch (error) {
    return next(error);
  }
};

export const updateServer = async (req, res, next) => {
  try {
    const server = await serverManager.updateServer(req.params.id, req.body);
    return res.json({ success: true, data: server });
  } catch (error) {
    return next(error);
  }
};

export const deleteServer = async (req, res, next) => {
  try {
    const result = await serverManager.deleteServer(req.params.id);
    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

export const healthCheck = async (req, res, next) => {
  try {
    const result = await serverManager.healthCheck(req.params.id);
    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

export const getServerStats = async (req, res, next) => {
  try {
    const stats = await serverManager.getServerStats(req.params.id);
    return res.json({ success: true, data: stats });
  } catch (error) {
    return next(error);
  }
};

export const syncConfig = async (req, res, next) => {
  try {
    const result = await serverManager.syncConfigToServer(req.params.id);
    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

export const autoBalance = async (req, res, next) => {
  try {
    const result = await serverManager.autoBalance();
    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

export const assignClient = async (req, res, next) => {
  try {
    const { serverId } = req.body;
    const assignment = await serverManager.assignClientToServer(req.params.clientId, serverId);
    return res.json({ success: true, data: assignment });
  } catch (error) {
    return next(error);
  }
};

export const migrateClient = async (req, res, next) => {
  try {
    const { fromServerId, toServerId } = req.body;
    const result = await serverManager.migrateClient(req.params.clientId, fromServerId, toServerId);
    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

import inboundService from '../services/inbound/inboundService.js';

const serializeInbound = (inbound) => {
  if (!inbound) return inbound;
  const safe = { ...inbound };
  if (typeof safe.up === 'bigint') safe.up = safe.up.toString();
  if (typeof safe.down === 'bigint') safe.down = safe.down.toString();
  if (typeof safe.totalTraffic === 'bigint') safe.totalTraffic = safe.totalTraffic.toString();
  if (Array.isArray(safe.clients)) {
    safe.clients = safe.clients.map((c) => {
      const client = { ...c };
      if (typeof client.up === 'bigint') client.up = client.up.toString();
      if (typeof client.down === 'bigint') client.down = client.down.toString();
      return client;
    });
  }
  return safe;
};

export const createInbound = async (req, res, next) => {
  try {
    const { remark, protocol, port, network, security, settings, streamSettings, listen, tag } = req.body;
    const userId = req.user?.sub;
    const inbound = await inboundService.createInbound(userId, {
      remark,
      protocol,
      port,
      network,
      security,
      settings,
      streamSettings,
      listen,
      tag
    });
    return res.status(201).json({
      success: true,
      message: 'Inbound created successfully',
      data: serializeInbound(inbound)
    });
  } catch (error) {
    return next(error);
  }
};

export const getInbounds = async (req, res, next) => {
  try {
    const { protocol, isActive, search, page = 1, limit = 10 } = req.query;
    const userId = req.user?.role === 'ADMIN' ? null : req.user?.sub;
    const result = await inboundService.getInbounds(userId, {
      protocol,
      isActive: typeof isActive === 'undefined' ? undefined : isActive === 'true',
      search,
      page: Number(page),
      limit: Number(limit)
    });
    return res.json({
      success: true,
      data: { ...result, inbounds: result.inbounds.map((i) => serializeInbound(i)) }
    });
  } catch (error) {
    return next(error);
  }
};

export const getInboundById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.role === 'ADMIN' ? null : req.user?.sub;
    const inbound = await inboundService.getInboundById(id, userId);
    return res.json({ success: true, data: serializeInbound(inbound) });
  } catch (error) {
    return next(error);
  }
};

export const updateInbound = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.role === 'ADMIN' ? null : req.user?.sub;
    const inbound = await inboundService.updateInbound(id, userId, req.body);
    return res.json({ success: true, message: 'Inbound updated', data: serializeInbound(inbound) });
  } catch (error) {
    return next(error);
  }
};

export const deleteInbound = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.role === 'ADMIN' ? null : req.user?.sub;
    await inboundService.deleteInbound(id, userId);
    return res.json({ success: true, message: 'Inbound deleted' });
  } catch (error) {
    return next(error);
  }
};

export const toggleInbound = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.role === 'ADMIN' ? null : req.user?.sub;
    const result = await inboundService.toggleInbound(id, userId);
    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

export const restartInbound = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.role === 'ADMIN' ? null : req.user?.sub;
    await inboundService.restartInbound(id, userId);
    return res.json({ success: true, message: 'Inbound restarted' });
  } catch (error) {
    return next(error);
  }
};

export const getInboundStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const stats = await inboundService.getInboundStats(id);
    if (typeof stats.up === 'bigint') stats.up = stats.up.toString();
    if (typeof stats.down === 'bigint') stats.down = stats.down.toString();
    if (typeof stats.total === 'bigint') stats.total = stats.total.toString();
    return res.json({ success: true, data: stats });
  } catch (error) {
    return next(error);
  }
};

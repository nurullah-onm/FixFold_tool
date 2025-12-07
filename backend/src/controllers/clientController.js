import clientService from '../services/client/clientService.js';
import qrcodeService from '../services/client/qrcodeService.js';
import subscriptionService from '../services/client/subscriptionService.js';

const serialize = (client) => {
  const toStr = (v) => (typeof v === 'bigint' ? v.toString() : v);
  if (!client) return client;
  const copy = { ...client };
  ['up', 'down', 'totalGB', 'total'].forEach((key) => {
    if (copy[key] !== undefined) copy[key] = toStr(copy[key]);
  });
  return copy;
};

export const createClient = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const role = req.user?.role;
    const { inboundId } = req.body;
    const client = await clientService.createClient(userId, role, inboundId, req.body);
    return res.status(201).json({ success: true, data: serialize(client) });
  } catch (error) {
    return next(error);
  }
};

export const bulkCreateClients = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const role = req.user?.role;
    const { inboundId, count, template } = req.body;
    const result = await clientService.bulkCreateClients(userId, role, inboundId, count, template);
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

export const getClients = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const role = req.user?.role;
    const result = await clientService.getClients(userId, role, req.query);
    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

export const getClientById = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const role = req.user?.role;
    const client = await clientService.getClientById(req.params.id, userId, role);
    return res.json({ success: true, data: serialize(client) });
  } catch (error) {
    return next(error);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const role = req.user?.role;
    const client = await clientService.updateClient(req.params.id, userId, role, req.body);
    return res.json({ success: true, data: serialize(client) });
  } catch (error) {
    return next(error);
  }
};

export const deleteClient = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const role = req.user?.role;
    const result = await clientService.deleteClient(req.params.id, userId, role);
    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

export const toggleClient = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const role = req.user?.role;
    const result = await clientService.toggleClient(req.params.id, userId, role);
    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

export const resetClientTraffic = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const role = req.user?.role;
    const result = await clientService.resetClientTraffic(req.params.id, userId, role);
    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

export const getClientStats = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const role = req.user?.role;
    const stats = await clientService.getClientStats(req.params.id, userId, role);
    return res.json({ success: true, data: stats });
  } catch (error) {
    return next(error);
  }
};

export const getClientQRCode = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const role = req.user?.role;
    const data = await qrcodeService.generateQRCode(req.params.id, userId, role);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const getClientSubscriptionLink = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    const role = req.user?.role;
    const client = await clientService.getClientById(req.params.id, userId, role);
    const base64 = await subscriptionService.generateSubscription(client.subId);
    return res.json({ success: true, data: { subscription: base64 } });
  } catch (error) {
    return next(error);
  }
};

export const getPublicSubscription = async (req, res, next) => {
  try {
    const base64 = await subscriptionService.generateSubscription(req.params.subId);
    return res.json({ success: true, data: { subscription: base64 } });
  } catch (error) {
    return next(error);
  }
};

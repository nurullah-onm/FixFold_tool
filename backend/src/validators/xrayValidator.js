import Joi from 'joi';

export const streamSettingsSchema = Joi.object({
  network: Joi.string().valid('tcp', 'ws', 'grpc', 'http', 'quic').required(),
  security: Joi.string().valid('none', 'tls', 'reality').default('none'),
  tlsSettings: Joi.object().optional(),
  realitySettings: Joi.object().optional()
});

export const sniffingSchema = Joi.object({
  enabled: Joi.boolean().default(true),
  destOverride: Joi.array().items(Joi.string()).default(['http', 'tls', 'quic'])
});

export const inboundSchema = Joi.object({
  tag: Joi.string().optional(),
  listen: Joi.string().optional(),
  port: Joi.number().integer().min(1).max(65535).required(),
  protocol: Joi.string().valid('vmess', 'vless', 'trojan', 'shadowsocks').required(),
  settings: Joi.object().required(),
  streamSettings: streamSettingsSchema.optional(),
  sniffing: sniffingSchema.optional()
});

export const configSchema = Joi.object({
  log: Joi.object().required(),
  api: Joi.object().required(),
  inbounds: Joi.array().items(inboundSchema).min(1).required(),
  outbounds: Joi.array().items(Joi.object()).min(1).required(),
  routing: Joi.object().required(),
  dns: Joi.object().optional(),
  policy: Joi.object().optional(),
  stats: Joi.object().optional(),
  isActive: Joi.boolean().optional()
}).unknown(true);

export const validateConfigRequest = (req, res, next) => {
  const { error } = configSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return next();
};

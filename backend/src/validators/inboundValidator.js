import Joi from 'joi';

const protocolEnum = ['VMESS', 'VLESS', 'TROJAN', 'SHADOWSOCKS', 'DOKODEMO', 'SOCKS', 'HTTP', 'WIREGUARD'];
const networkEnum = ['TCP', 'WS', 'GRPC', 'HTTP2', 'QUIC', 'KCP'];
const securityEnum = ['NONE', 'TLS', 'REALITY'];

const inboundSchema = Joi.object({
  isActive: Joi.boolean().default(true),
  remark: Joi.string().min(1).max(100).required(),
  protocol: Joi.string().valid(...protocolEnum).required(),
  port: Joi.number().integer().min(1).max(65535).required(),
  listen: Joi.string().ip().default('0.0.0.0'),
  tag: Joi.string().optional(),
  network: Joi.string().valid(...networkEnum).default('TCP'),
  security: Joi.string().valid(...securityEnum).default('NONE'),
  settings: Joi.object({
    totalFlows: Joi.number().integer().min(0).optional(),
    resetDay: Joi.number().integer().min(0).max(31).optional(),
    duration: Joi.alternatives(Joi.number(), Joi.string()).allow(null, '').optional(),
    auth: Joi.string().valid('none', 'password', 'token').optional(),
    decryption: Joi.string().optional(),
    encryption: Joi.string().optional(),
    fallbacks: Joi.array().items(Joi.string()).optional(),
    proxyProtocol: Joi.boolean().optional(),
    httpObfuscation: Joi.object({
      host: Joi.string().allow(''),
      path: Joi.string().allow('')
    }).optional(),
    sockopt: Joi.object({
      tproxy: Joi.boolean().optional(),
      mark: Joi.alternatives(Joi.string(), Joi.number()).allow('').optional()
    }).optional(),
    externalProxy: Joi.string().allow('').optional(),
    clients: Joi.array().items(Joi.object().unknown(true)).optional()
  }).unknown(true).required(),
  streamSettings: Joi.object().default({}),
  tlsSettings: Joi.object().when('security', { is: 'TLS', then: Joi.required() }),
  realitySettings: Joi.object().when('security', { is: 'REALITY', then: Joi.required() }),
  sniffing: Joi.object().default({ enabled: true, destOverride: ['http', 'tls'] }),
  allocate: Joi.object().optional()
});

const inboundUpdateSchema = inboundSchema.fork(['protocol', 'port'], (schema) => schema.optional());

export const validateInbound = (req, res, next) => {
  const { error } = inboundSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });
  return next();
};

export const validateInboundUpdate = (req, res, next) => {
  const { error } = inboundUpdateSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });
  return next();
};

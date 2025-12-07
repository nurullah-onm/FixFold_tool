import Joi from 'joi';

const clientCreateSchema = Joi.object({
  inboundId: Joi.string().required(),
  email: Joi.string().email().required(),
  totalGB: Joi.alternatives(Joi.number(), Joi.string()).default(0),
  expiryTime: Joi.date().optional(),
  limitIp: Joi.number().integer().min(0).default(0),
  tgId: Joi.string().optional(),
  reset: Joi.number().integer().min(0).max(31).default(0),
  enable: Joi.boolean().optional(),
  flow: Joi.string().optional(),
  password: Joi.string().optional(),
  uuid: Joi.string().uuid().optional()
}).unknown(true);

const clientUpdateSchema = clientCreateSchema.fork(['inboundId'], (s) => s.forbidden());

const bulkCreateSchema = Joi.object({
  inboundId: Joi.string().required(),
  count: Joi.number().integer().min(1).max(500).required(),
  template: Joi.object({
    emailPrefix: Joi.string().optional(),
    totalGB: Joi.alternatives(Joi.number(), Joi.string()).optional(),
    expiryTime: Joi.date().optional(),
    limitIp: Joi.number().integer().min(0).optional(),
    reset: Joi.number().integer().min(0).max(31).optional()
  }).default({})
});

export const validateCreateClient = (req, res, next) => {
  const { error } = clientCreateSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });
  return next();
};

export const validateUpdateClient = (req, res, next) => {
  const { error } = clientUpdateSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });
  return next();
};

export const validateBulkCreate = (req, res, next) => {
  const { error } = bulkCreateSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });
  return next();
};

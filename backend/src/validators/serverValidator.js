import Joi from 'joi';

const serverCreateSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  hostname: Joi.string().required(),
  port: Joi.number().integer().min(1).max(65535).default(443),
  type: Joi.string().valid('MASTER', 'SLAVE').default('SLAVE'),
  maxClients: Joi.number().integer().min(1).default(1000),
  country: Joi.string().optional(),
  city: Joi.string().optional(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  tags: Joi.object().optional(),
  notes: Joi.string().optional()
});

const serverUpdateSchema = serverCreateSchema.fork(['name', 'hostname', 'type'], (schema) =>
  schema.optional()
);

const assignSchema = Joi.object({
  serverId: Joi.string().optional()
});

const migrateSchema = Joi.object({
  fromServerId: Joi.string().required(),
  toServerId: Joi.string().required()
});

export const validateServerCreate = (req, res, next) => {
  const { error } = serverCreateSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.message });
  return next();
};

export const validateServerUpdate = (req, res, next) => {
  const { error } = serverUpdateSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.message });
  return next();
};

export const validateAssign = (req, res, next) => {
  const { error } = assignSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.message });
  return next();
};

export const validateMigrate = (req, res, next) => {
  const { error } = migrateSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.message });
  return next();
};

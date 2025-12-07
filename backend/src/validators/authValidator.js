import Joi from 'joi';

const username = Joi.string().min(3).required();
const password = Joi.string().min(8).required();
const email = Joi.string().email().required();

const registerSchema = Joi.object({
  username,
  password,
  email
});

const loginSchema = Joi.object({
  username,
  password
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

const changePasswordSchema = Joi.object({
  oldPassword: password,
  newPassword: password
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
  return next();
};

export const validateRegister = validate(registerSchema);
export const validateLogin = validate(loginSchema);
export const validateRefresh = validate(refreshSchema);
export const validateChangePassword = validate(changePasswordSchema);

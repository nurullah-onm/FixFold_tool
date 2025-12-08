/* Centralized error handler to avoid leaking internal details */
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Unexpected error';
  const payload = {
    success: false,
    error: message
  };

  if (err.code) payload.code = err.code;
  if (req.app.get('env') !== 'production' && err.stack) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
};

export default errorHandler;

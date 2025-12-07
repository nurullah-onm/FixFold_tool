/* Centralized error handler to avoid leaking internal details */
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Unexpected error';
  const payload = {
    success: false,
    error: message,
    ...(req.app.get('env') !== 'production' && err.stack ? { stack: err.stack } : {})
  };

  res.status(status).json(payload);
};

export default errorHandler;

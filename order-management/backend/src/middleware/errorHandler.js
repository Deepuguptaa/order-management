/**
 * Centralized error handler. Normalizes Mongoose validation/duplicate-key
 * errors into clean 4xx responses, and logs unexpected errors with a 500.
 */
function errorHandler(err, req, res, next) {
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: messages,
    });
  }

  // Mongoose duplicate key error (e.g. duplicate idempotencyKey or orderId)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}. This order may have already been submitted.`,
    });
  }

  // Mongoose invalid ObjectId / cast error
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid value for ${err.path}`,
    });
  }

  console.error('Unhandled error:', err);
  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = { errorHandler, notFoundHandler };

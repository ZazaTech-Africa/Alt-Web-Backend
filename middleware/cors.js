/**
 * Custom middleware to handle CORS errors and provide better error messages
 */
const corsErrorHandler = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    console.error(`CORS Error: ${req.headers.origin} tried to access ${req.path}`);
    return res.status(403).json({
      success: false,
      message: 'CORS Error: This origin is not allowed to access this resource',
      origin: req.headers.origin,
      allowedOrigins: req.app.get('allowedOrigins') || 'Not configured'
    });
  }
  next(err);
};

module.exports = corsErrorHandler;
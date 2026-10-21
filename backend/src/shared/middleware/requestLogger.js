const { logger } = require('../utils/logger');
const { env } = require('../../config/env');

/**
 * Lightweight HTTP request logger using Pino
 */
function requestLogger(req, res, next) {
  if (env.NODE_ENV === 'test') {
    return next();
  }

  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'HTTP Request Failed');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'HTTP Client Error');
    } else {
      logger.info(logData, 'HTTP Request Completed');
    }
  });

  next();
}

module.exports = {
  requestLogger
};

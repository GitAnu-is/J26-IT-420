const rateLimit = require('express-rate-limit');
const { env } = require('../../config/env');
const { sendError } = require('../utils/apiResponse');
const { ERROR_CODES } = require('../constants/errorCodes');

/**
 * Authentication rate limiter to protect login and registration against brute-force attacks
 */
const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 1000 : env.AUTH_RATE_LIMIT_MAX || 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(res, {
      statusCode: 429,
      message: 'Too many authentication attempts. Please try again later.',
      code: ERROR_CODES.TOO_MANY_REQUESTS
    });
  },
  skip: () => env.NODE_ENV === 'test'
});

module.exports = {
  authLimiter
};

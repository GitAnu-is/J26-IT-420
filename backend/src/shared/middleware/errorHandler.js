const { ZodError } = require('zod');
const { AppError } = require('../errors/AppError');
const { sendError } = require('../utils/apiResponse');
const { STATUS_CODES } = require('../constants/statusCodes');
const { ERROR_CODES } = require('../constants/errorCodes');
const { logger } = require('../utils/logger');
const { env } = require('../../config/env');

/**
 * Centralized Express Error Handling Middleware
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // 1. Handle JSON parse/syntax error (e.g., malformed JSON request body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.warn({ path: req.path, ip: req.ip }, 'Malformed JSON request body received');
    return sendError(res, {
      statusCode: STATUS_CODES.BAD_REQUEST,
      message: 'Invalid JSON payload received in request body',
      code: ERROR_CODES.MALFORMED_JSON,
      details: [{ field: 'body', message: err.message }]
    });
  }

  // 2. Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      rule: issue.code
    }));

    logger.warn({ path: req.path, details }, 'Request validation failed');
    return sendError(res, {
      statusCode: STATUS_CODES.BAD_REQUEST,
      message: 'Request validation failed',
      code: ERROR_CODES.VALIDATION_ERROR,
      details
    });
  }

  // 3. Handle custom application errors (AppError)
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path }, err.message);
    } else {
      logger.warn({ path: req.path, code: err.errorCode, details: err.details }, err.message);
    }

    return sendError(res, {
      statusCode: err.statusCode,
      message: err.message,
      code: err.errorCode,
      details: err.details
    });
  }

  // 4. Handle Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, {
      statusCode: STATUS_CODES.BAD_REQUEST,
      message: `Invalid format for field: ${err.path}`,
      code: ERROR_CODES.VALIDATION_ERROR,
      details: [{ field: err.path, message: `Value '${err.value}' is not valid` }]
    });
  }

  // 5. Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message
    }));

    return sendError(res, {
      statusCode: STATUS_CODES.BAD_REQUEST,
      message: 'Database validation failed',
      code: ERROR_CODES.VALIDATION_ERROR,
      details
    });
  }

  // 6. Handle MongoDB duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    const isEmail = field === 'email';
    return sendError(res, {
      statusCode: STATUS_CODES.CONFLICT,
      message: isEmail
        ? 'An account with this email address already exists'
        : `Duplicate value provided for unique field: ${field}`,
      code: isEmail ? ERROR_CODES.DUPLICATE_EMAIL : ERROR_CODES.BAD_REQUEST,
      details: [{ field, message: `A record with this ${field} already exists` }]
    });
  }

  // 6. Handle CORS origin rejection
  if (err.message && err.message.includes('CORS')) {
    logger.warn({ origin: req.headers.origin, path: req.path }, err.message);
    return sendError(res, {
      statusCode: STATUS_CODES.FORBIDDEN,
      message: err.message,
      code: ERROR_CODES.FORBIDDEN
    });
  }

  // 7. Unhandled / generic server errors
  logger.error({ err: err.stack || err, path: req.path, method: req.method }, 'Unhandled internal server error');

  const message = env.NODE_ENV === 'production'
    ? 'An unexpected internal server error occurred'
    : err.message || 'An unexpected internal server error occurred';

  return sendError(res, {
    statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR,
    message,
    code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    details: env.NODE_ENV === 'production' ? [] : [{ stack: err.stack }]
  });
}

module.exports = {
  errorHandler
};

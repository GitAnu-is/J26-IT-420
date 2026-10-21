const { STATUS_CODES } = require('../constants/statusCodes');
const { ERROR_CODES } = require('../constants/errorCodes');

/**
 * Base Application Error
 */
class AppError extends Error {
  constructor(message, statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR, errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR, details = []) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details = [], errorCode = ERROR_CODES.BAD_REQUEST) {
    super(message, STATUS_CODES.BAD_REQUEST, errorCode, details);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = []) {
    super(message, STATUS_CODES.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details = [], errorCode = ERROR_CODES.NOT_FOUND) {
    super(message, STATUS_CODES.NOT_FOUND, errorCode, details);
  }
}

class RouteNotFoundError extends AppError {
  constructor(method, path) {
    super(`Cannot ${method} ${path}`, STATUS_CODES.NOT_FOUND, ERROR_CODES.ROUTE_NOT_FOUND, [
      { field: 'path', message: `Route ${method} ${path} does not exist on this server` }
    ]);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', details = [], errorCode = ERROR_CODES.UNAUTHORIZED) {
    super(message, STATUS_CODES.UNAUTHORIZED, errorCode, details);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden', details = [], errorCode = ERROR_CODES.FORBIDDEN) {
    super(message, STATUS_CODES.FORBIDDEN, errorCode, details);
  }
}

class NotImplementedError extends AppError {
  constructor(message = 'Feature is scheduled for a future research phase and is not yet implemented', details = []) {
    super(message, STATUS_CODES.NOT_IMPLEMENTED, ERROR_CODES.NOT_IMPLEMENTED, details);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', details = []) {
    super(message, STATUS_CODES.INTERNAL_SERVER_ERROR, ERROR_CODES.DATABASE_ERROR, details);
  }
}

class UnsupportedCropError extends AppError {
  constructor(crop) {
    super(
      `Unsupported crop '${crop}'. Supported crops are BANANA, PINEAPPLE, and BLACK_PEPPER.`,
      STATUS_CODES.BAD_REQUEST,
      ERROR_CODES.UNSUPPORTED_CROP,
      [{ field: 'crop', message: `Crop must be one of: BANANA, PINEAPPLE, BLACK_PEPPER` }]
    );
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details = [], errorCode = ERROR_CODES.BAD_REQUEST) {
    super(message, STATUS_CODES.CONFLICT, errorCode, details);
  }
}

class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests, please try again later', details = []) {
    super(message, 429, ERROR_CODES.TOO_MANY_REQUESTS, details);
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', details = []) {
    super(message, STATUS_CODES.SERVICE_UNAVAILABLE, ERROR_CODES.SERVICE_UNAVAILABLE, details);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  ValidationError,
  NotFoundError,
  RouteNotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  TooManyRequestsError,
  ServiceUnavailableError,
  NotImplementedError,
  DatabaseError,
  UnsupportedCropError
};

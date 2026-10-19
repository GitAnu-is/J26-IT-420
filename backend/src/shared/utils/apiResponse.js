const { STATUS_CODES } = require('../constants/statusCodes');
const { ERROR_CODES } = require('../constants/errorCodes');

/**
 * Format and send a standardized success response
 * @param {import('express').Response} res
 * @param {object} options
 * @param {number} [options.statusCode=200]
 * @param {string} [options.message='Request completed successfully']
 * @param {any} [options.data={}]
 * @returns {import('express').Response}
 */
function sendSuccess(res, { statusCode = STATUS_CODES.OK, message = 'Request completed successfully', data = {} } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

/**
 * Format and send a standardized error response
 * @param {import('express').Response} res
 * @param {object} options
 * @param {number} [options.statusCode=500]
 * @param {string} [options.message='An unexpected error occurred']
 * @param {string} [options.code='INTERNAL_SERVER_ERROR']
 * @param {Array<any>} [options.details=[]]
 * @returns {import('express').Response}
 */
function sendError(res, {
  statusCode = STATUS_CODES.INTERNAL_SERVER_ERROR,
  message = 'An unexpected error occurred',
  code = ERROR_CODES.INTERNAL_SERVER_ERROR,
  details = []
} = {}) {
  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      details
    }
  });
}

module.exports = {
  sendSuccess,
  sendError
};

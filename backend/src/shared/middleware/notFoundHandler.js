const { RouteNotFoundError } = require('../errors/AppError');

/**
 * 404 Route Not Found Handler
 */
function notFoundHandler(req, res, next) {
  next(new RouteNotFoundError(req.method, req.originalUrl));
}

module.exports = {
  notFoundHandler
};

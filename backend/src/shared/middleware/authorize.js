const { ForbiddenError, UnauthorizedError } = require('../errors/AppError');

/**
 * Role-Based Access Control (RBAC) Middleware Factory
 * @param {...string} allowedRoles Roles authorized to access the route
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication is required prior to role authorization'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access forbidden: User role '${req.user.role}' is not authorized for this resource. Required role(s): ${allowedRoles.join(', ')}`
        )
      );
    }

    return next();
  };
}

module.exports = {
  authorize
};

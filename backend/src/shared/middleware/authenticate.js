const tokenService = require('../services/tokenService');
const User = require('../models/User');
const { UnauthorizedError } = require('../errors/AppError');
const { ERROR_CODES } = require('../constants/errorCodes');

/**
 * JWT Authentication Middleware
 * Enforces valid Bearer JWT access tokens, active accounts, and password invalidation
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('Authorization header is required (Format: Bearer <token>)');
    }

    if (!authHeader.startsWith('Bearer ') && authHeader !== 'Bearer') {
      throw new UnauthorizedError('Invalid authorization format. Format must be: Bearer <token>');
    }

    const token = authHeader.replace(/^Bearer\s*/, '').trim();
    if (!token) {
      throw new UnauthorizedError('Bearer token is empty');
    }

    // Verify JWT cryptographic signature and claims
    const decoded = tokenService.verifyAccessToken(token);

    // Verify user exists and is active
    const user = await User.findById(decoded.sub);
    if (!user) {
      throw new UnauthorizedError('User account associated with this token no longer exists', [], ERROR_CODES.UNAUTHORIZED);
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is deactivated', [], ERROR_CODES.ACCOUNT_INACTIVE);
    }

    // Check if password was changed after token issuance (iat is in seconds)
    if (user.passwordChangedAt) {
      const changedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedTimestamp) {
        throw new UnauthorizedError(
          'Password was recently changed. Please log in again.',
          [],
          ERROR_CODES.UNAUTHORIZED
        );
      }
    }

    // Attach verified user and token payload to request
    req.user = user;
    req.tokenPayload = decoded;
    return next();
  } catch (error) {
    return next(error);
  }
}

/**
 * Optional authentication: Attaches user if valid Bearer token is provided, otherwise continues
 */
async function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.replace(/^Bearer\s*/, '').trim();
    if (token) {
      const decoded = tokenService.verifyAccessToken(token);
      const user = await User.findById(decoded.sub);
      if (user && user.isActive) {
        req.user = user;
        req.tokenPayload = decoded;
      }
    }
  } catch (err) {
    // Ignore invalid tokens for optional authentication
  }

  return next();
}

module.exports = {
  authenticate,
  optionalAuthenticate
};

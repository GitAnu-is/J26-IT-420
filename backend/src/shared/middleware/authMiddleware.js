/**
 * Authentication Middleware facade re-exporting Phase 2 JWT authentication implementations
 */
const { authenticate, optionalAuthenticate } = require('./authenticate');

module.exports = {
  authenticate,
  optionalAuthenticate
};

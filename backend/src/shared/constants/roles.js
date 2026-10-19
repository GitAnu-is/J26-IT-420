/**
 * Standard Application Roles for AgriGuard Platform
 * These are platform access and authorization roles, not research component identifiers.
 */
const ROLES = Object.freeze({
  FARMER: 'FARMER',
  AGRICULTURAL_OFFICER: 'AGRICULTURAL_OFFICER',
  TRANSPORT_OPERATOR: 'TRANSPORT_OPERATOR',
  ADMIN: 'ADMIN'
});

const ROLE_LIST = Object.freeze(Object.values(ROLES));

/**
 * Roles permitted for public self-registration.
 * ADMIN cannot be selected during self-registration to prevent privilege escalation.
 */
const PUBLIC_REGISTRATION_ROLES = Object.freeze([
  ROLES.FARMER,
  ROLES.AGRICULTURAL_OFFICER,
  ROLES.TRANSPORT_OPERATOR
]);

/**
 * Validate whether a role is recognized by the system
 * @param {string} role
 * @returns {boolean}
 */
function isValidRole(role) {
  return typeof role === 'string' && ROLE_LIST.includes(role);
}

/**
 * Validate whether a role is permitted for public account creation
 * @param {string} role
 * @returns {boolean}
 */
function isPublicRole(role) {
  return typeof role === 'string' && PUBLIC_REGISTRATION_ROLES.includes(role);
}

module.exports = {
  ROLES,
  ROLE_LIST,
  PUBLIC_REGISTRATION_ROLES,
  isValidRole,
  isPublicRole
};

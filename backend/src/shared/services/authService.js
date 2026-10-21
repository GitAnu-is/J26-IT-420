const User = require('../models/User');
const tokenService = require('./tokenService');
const { ConflictError, UnauthorizedError } = require('../errors/AppError');
const { ERROR_CODES } = require('../constants/errorCodes');

class AuthService {
  /**
   * Register a new user account
   * @param {object} registrationData
   * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>}
   */
  async register({ fullName, email, password, phoneNumber, role }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check email uniqueness
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ConflictError('An account with this email address already exists', [], ERROR_CODES.DUPLICATE_EMAIL);
    }

    // Hash password securely
    const passwordHash = await User.hashPassword(password);

    // Persist new user
    const user = await User.create({
      fullName,
      email: normalizedEmail,
      passwordHash,
      phoneNumber: phoneNumber || '',
      role
    });

    // Create session and issue tokens
    const accessToken = tokenService.generateAccessToken(user);
    const { refreshToken } = await tokenService.createRefreshSession(user);

    return {
      user: user.toSafeObject(),
      accessToken,
      refreshToken
    };
  }

  /**
   * Authenticate user credentials and issue tokens
   * @param {object} credentials
   * @returns {Promise<{ user: object, accessToken: string, refreshToken: string }>}
   */
  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Query user including passwordHash for comparison
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      // Generic error message to prevent user enumeration
      throw new UnauthorizedError('Invalid email or password', [], ERROR_CODES.INVALID_CREDENTIALS);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password', [], ERROR_CODES.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated. Please contact support.', [], ERROR_CODES.ACCOUNT_INACTIVE);
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    // Issue tokens
    const accessToken = tokenService.generateAccessToken(user);
    const { refreshToken } = await tokenService.createRefreshSession(user);

    return {
      user: user.toSafeObject(),
      accessToken,
      refreshToken
    };
  }

  /**
   * Rotate refresh token and obtain a fresh token pair
   * @param {string} rawRefreshToken
   * @returns {Promise<{ accessToken: string, refreshToken: string, user: object }>}
   */
  async refresh(rawRefreshToken) {
    const result = await tokenService.rotateRefreshToken(rawRefreshToken);
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user.toSafeObject()
    };
  }

  /**
   * Revoke single session
   * @param {string} rawRefreshToken
   * @returns {Promise<boolean>}
   */
  async logout(rawRefreshToken) {
    return tokenService.revokeSession(rawRefreshToken);
  }

  /**
   * Revoke all active sessions for a user
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async logoutAll(userId) {
    return tokenService.revokeAllUserSessions(userId);
  }

  /**
   * Authenticated password change
   * @param {string} userId
   * @param {string} currentPassword
   * @param {string} newPassword
   * @returns {Promise<{ success: boolean }>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw new UnauthorizedError('User account not found', [], ERROR_CODES.UNAUTHORIZED);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new UnauthorizedError('Current password is incorrect', [], ERROR_CODES.INVALID_CREDENTIALS);
    }

    // Hash and store new password
    user.passwordHash = await User.hashPassword(newPassword);
    user.passwordChangedAt = new Date();
    await user.save();

    // Invalidate all active refresh sessions for security
    await tokenService.revokeAllUserSessions(userId);

    return { success: true };
  }
}

module.exports = new AuthService();

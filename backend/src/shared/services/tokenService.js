const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const RefreshSession = require('../models/RefreshSession');
const User = require('../models/User');
const { env } = require('../../config/env');
const { UnauthorizedError } = require('../errors/AppError');
const { ERROR_CODES } = require('../constants/errorCodes');

class TokenService {
  /**
   * Generate short-lived JWT access token
   * @param {object} user
   * @returns {string}
   */
  generateAccessToken(user) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      type: 'access'
    };

    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      algorithm: 'HS256'
    });
  }

  /**
   * Verify JWT access token
   * @param {string} token
   * @returns {object} Decoded payload
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
        algorithms: ['HS256']
      });

      if (decoded.type !== 'access') {
        throw new UnauthorizedError('Token is not an access token', [], ERROR_CODES.TOKEN_INVALID);
      }

      return decoded;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Access token has expired', [], ERROR_CODES.TOKEN_EXPIRED);
      }
      if (err instanceof UnauthorizedError) {
        throw err;
      }
      throw new UnauthorizedError('Invalid access token', [], ERROR_CODES.TOKEN_INVALID);
    }
  }

  /**
   * Hash a token secret using SHA-256
   * @param {string} secret
   * @returns {string}
   */
  hashTokenSecret(secret) {
    return crypto.createHash('sha256').update(secret).digest('hex');
  }

  /**
   * Create a persistent refresh session and return opaque refresh token string
   * @param {object} user
   * @param {string} [familyId]
   * @returns {Promise<{ refreshToken: string, expiresAt: Date }>}
   */
  async createRefreshSession(user, familyId = null) {
    const tokenSecret = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashTokenSecret(tokenSecret);
    const sessionFamilyId = familyId || crypto.randomUUID();

    // Parse refresh expiry (e.g. '7d')
    const expiryDays = 7;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const session = await RefreshSession.create({
      userId: user._id,
      tokenHash,
      familyId: sessionFamilyId,
      expiresAt
    });

    const refreshToken = `${session._id.toString()}.${tokenSecret}`;
    return { refreshToken, expiresAt };
  }

  /**
   * Rotate a refresh token and return new token pair
   * Implements strict replay/reuse detection
   * @param {string} rawRefreshToken
   * @returns {Promise<{ accessToken: string, refreshToken: string, user: object }>}
   */
  async rotateRefreshToken(rawRefreshToken) {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      throw new UnauthorizedError('Refresh token is required', [], ERROR_CODES.TOKEN_INVALID);
    }

    const parts = rawRefreshToken.split('.');
    if (parts.length !== 2) {
      throw new UnauthorizedError('Invalid refresh token structure', [], ERROR_CODES.TOKEN_INVALID);
    }

    const [sessionId, tokenSecret] = parts;
    if (!mongoose.Types.ObjectId.isValid(sessionId) || !tokenSecret) {
      throw new UnauthorizedError('Malformed refresh token', [], ERROR_CODES.TOKEN_INVALID);
    }

    const tokenHash = this.hashTokenSecret(tokenSecret);
    const session = await RefreshSession.findById(sessionId);

    if (!session) {
      throw new UnauthorizedError('Refresh session not found', [], ERROR_CODES.TOKEN_INVALID);
    }

    // Verify cryptographic secret match
    if (session.tokenHash !== tokenHash) {
      throw new UnauthorizedError('Invalid refresh token credential', [], ERROR_CODES.TOKEN_INVALID);
    }

    // REPLAY DETECTION: If session is already revoked, an adversary or replayed token is being used!
    if (session.isRevoked) {
      // Invalidate all active sessions in the family to safeguard the account
      await RefreshSession.updateMany(
        { familyId: session.familyId, isRevoked: false },
        { isRevoked: true, revokedAt: new Date() }
      );
      throw new UnauthorizedError(
        'Refresh token reuse detected. All active sessions in this family have been revoked.',
        [],
        ERROR_CODES.TOKEN_REUSE_DETECTED
      );
    }

    // Expiry check
    if (session.expiresAt < new Date()) {
      session.isRevoked = true;
      session.revokedAt = new Date();
      await session.save();
      throw new UnauthorizedError('Refresh token has expired', [], ERROR_CODES.TOKEN_EXPIRED);
    }

    // Fetch user and check active status
    const user = await User.findById(session.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User account is inactive or not found', [], ERROR_CODES.ACCOUNT_INACTIVE);
    }

    // Generate new session in the same rotation family
    const newSessionData = await this.createRefreshSession(user, session.familyId);

    // Atomically mark old session as revoked and record replacement
    session.isRevoked = true;
    session.revokedAt = new Date();
    session.replacedByTokenHash = this.hashTokenSecret(newSessionData.refreshToken.split('.')[1]);
    await session.save();

    // Generate new access token
    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      refreshToken: newSessionData.refreshToken,
      user
    };
  }

  /**
   * Revoke a single refresh session (Logout)
   * @param {string} rawRefreshToken
   * @returns {Promise<boolean>}
   */
  async revokeSession(rawRefreshToken) {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      return false;
    }

    const parts = rawRefreshToken.split('.');
    if (parts.length !== 2) {
      return false;
    }

    const [sessionId, tokenSecret] = parts;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return false;
    }

    const tokenHash = this.hashTokenSecret(tokenSecret);
    const session = await RefreshSession.findById(sessionId);

    if (session && session.tokenHash === tokenHash) {
      session.isRevoked = true;
      session.revokedAt = new Date();
      await session.save();
      return true;
    }

    return false;
  }

  /**
   * Revoke all active sessions for a user (Logout-All)
   * @param {string|mongoose.Types.ObjectId} userId
   * @returns {Promise<number>} Number of revoked sessions
   */
  async revokeAllUserSessions(userId) {
    const result = await RefreshSession.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date() }
    );
    return result.modifiedCount;
  }
}

module.exports = new TokenService();

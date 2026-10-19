const authService = require('../services/authService');
const { sendSuccess } = require('../utils/apiResponse');
const { STATUS_CODES } = require('../constants/statusCodes');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return sendSuccess(res, {
        statusCode: STATUS_CODES.CREATED,
        message: 'User account registered successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      return sendSuccess(res, {
        statusCode: STATUS_CODES.OK,
        message: 'Authentication successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refresh(refreshToken);
      return sendSuccess(res, {
        statusCode: STATUS_CODES.OK,
        message: 'Token rotated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      return sendSuccess(res, {
        statusCode: STATUS_CODES.OK,
        message: 'Refresh session successfully terminated'
      });
    } catch (error) {
      next(error);
    }
  }

  async logoutAll(req, res, next) {
    try {
      const revokedCount = await authService.logoutAll(req.user._id);
      return sendSuccess(res, {
        statusCode: STATUS_CODES.OK,
        message: `All active sessions revoked successfully (${revokedCount} session(s) terminated)`
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      return sendSuccess(res, {
        statusCode: STATUS_CODES.OK,
        message: 'Authenticated profile retrieved successfully',
        data: {
          user: req.user.toSafeObject()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user._id, currentPassword, newPassword);
      return sendSuccess(res, {
        statusCode: STATUS_CODES.OK,
        message: 'Password changed successfully. All active sessions have been revoked.'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

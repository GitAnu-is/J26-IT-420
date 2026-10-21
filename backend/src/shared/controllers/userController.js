const userService = require('../services/userService');
const { sendSuccess } = require('../utils/apiResponse');
const { STATUS_CODES } = require('../constants/statusCodes');

class UserController {
  async getMe(req, res, next) {
    try {
      const profile = await userService.getProfile(req.user._id);
      return sendSuccess(res, {
        statusCode: STATUS_CODES.OK,
        message: 'User profile retrieved successfully',
        data: { profile }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req, res, next) {
    try {
      const updatedProfile = await userService.updateProfile(req.user._id, req.body);
      return sendSuccess(res, {
        statusCode: STATUS_CODES.OK,
        message: 'User profile updated successfully',
        data: { profile: updatedProfile }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();

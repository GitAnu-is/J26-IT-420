const User = require('../models/User');
const { NotFoundError } = require('../errors/AppError');

class UserService {
  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }
    return user.toSafeObject();
  }

  async updateProfile(userId, { fullName, phoneNumber }) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;

    await user.save();
    return user.toSafeObject();
  }
}

module.exports = new UserService();

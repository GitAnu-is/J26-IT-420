const farmService = require('../services/farmService');
const { sendSuccess } = require('../utils/apiResponse');
const { STATUS_CODES } = require('../constants/statusCodes');

class FarmController {
  async createFarm(req, res, next) {
    try {
      const farm = await farmService.createFarm(req.user._id, req.body);
      return sendSuccess(res, {
        statusCode: STATUS_CODES.CREATED,
        message: 'Farm registered successfully',
        data: { farm }
      });
    } catch (error) {
      next(error);
    }
  }

  async listFarms(req, res, next) {
    try {
      const result = await farmService.listFarms(req.user, req.query);
      return sendSuccess(res, {
        statusCode: STATUS_CODES.OK,
        message: 'Farms retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getFarmById(req, res, next) {
    try {
      const farm = await farmService.getFarmById(req.user, req.params.id);
      return sendSuccess(res, {
        statusCode: STATUS_CODES.OK,
        message: 'Farm record retrieved successfully',
        data: { farm }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateFarm(req, res, next) {
    try {
      const farm = await farmService.updateFarm(req.user, req.params.id, req.body);
      return sendSuccess(res, {
        statusCode: STATUS_CODES.OK,
        message: 'Farm record updated successfully',
        data: { farm }
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteFarm(req, res, next) {
    try {
      await farmService.deleteFarm(req.user, req.params.id);
      return sendSuccess(res, {
        statusCode: STATUS_CODES.OK,
        message: 'Farm record deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getFarmOverview(req, res, next) {
    try {
      const overview = await farmService.getFarmOverview(req.user, req.params.id);
      return sendSuccess(res, {
        statusCode: STATUS_CODES.OK,
        message: 'Farm consolidated overview retrieved successfully',
        data: overview
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FarmController();

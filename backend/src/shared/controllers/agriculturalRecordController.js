const agriculturalRecordService = require('../services/agriculturalRecordService');
const { sendSuccess } = require('../utils/apiResponse');
const { STATUS_CODES } = require('../constants/statusCodes');

class AgriculturalRecordController {
  async createRecord(req, res, next) {
    try {
      const record = await agriculturalRecordService.createRecord(req.user, req.body);
      return sendSuccess(res, {
        statusCode: STATUS_CODES.CREATED,
        message: 'Agricultural record created successfully',
        data: { record }
      });
    } catch (error) {
      next(error);
    }
  }

  async listRecords(req, res, next) {
    try {
      const result = await agriculturalRecordService.listRecords(req.user, req.query);
      return sendSuccess(res, {
        statusCode: STATUS_CODES.OK,
        message: 'Agricultural records retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecordById(req, res, next) {
    try {
      const record = await agriculturalRecordService.getRecordById(req.user, req.params.id);
      return sendSuccess(res, {
        statusCode: STATUS_CODES.OK,
        message: 'Agricultural record retrieved successfully',
        data: { record }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRecord(req, res, next) {
    try {
      const record = await agriculturalRecordService.updateRecord(req.user, req.params.id, req.body);
      return sendSuccess(res, {
        statusCode: STATUS_CODES.OK,
        message: 'Agricultural record updated successfully',
        data: { record }
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteRecord(req, res, next) {
    try {
      await agriculturalRecordService.deleteRecord(req.user, req.params.id);
      return sendSuccess(res, {
        statusCode: STATUS_CODES.OK,
        message: 'Agricultural record deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AgriculturalRecordController();

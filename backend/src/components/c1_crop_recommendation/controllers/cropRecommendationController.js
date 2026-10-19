const service = require('../services/cropRecommendationService');
const { sendSuccess } = require('../../../shared/utils/apiResponse');
const { SUPPORTED_CROP_LIST, CROP_METADATA } = require('../../../shared/constants/crops');

const { getModelProvenance } = require('../../../shared/constants/modelProvenance');

/**
 * Controller for Component 1: Crop Recommendation and Harvest Planning
 */
class CropRecommendationController {
  /**
   * Informational endpoint for Component 1
   */
  async getComponentInfo(req, res) {
    return sendSuccess(res, {
      message: 'Component 1: AI-Based Crop Recommendation and Harvest Planning System',
      data: {
        componentId: 'C1',
        status: 'active',
        supportedCrops: SUPPORTED_CROP_LIST,
        cropDetails: CROP_METADATA,
        endpoints: {
          recommendCrop: 'POST /api/v1/crops/recommend',
          predictHarvest: 'POST /api/v1/crops/predict-harvest',
          history: 'GET /api/v1/crops/history'
        },
        models: {
          recommendation: 'Random Forest Classifier',
          harvestPrediction: 'Random Forest Regressor'
        },
        researchProvenance: {
          cropRecommendation: getModelProvenance('C1_CROP_RECOMMENDATION'),
          harvestPlanning: getModelProvenance('C1_HARVEST_PLANNING')
        },
        phaseStatus: 'Phase 6 Integration Verified. ML inference microservice operational on port 8001.'
      }
    });
  }

  async recommendCrop(req, res, next) {
    try {
      const result = await service.recommendCrop(req.body, req.user || null);
      return sendSuccess(res, {
        message: 'Crop recommendation generated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async predictHarvest(req, res, next) {
    try {
      const result = await service.predictHarvestWindow(req.body, req.user || null);
      return sendSuccess(res, {
        message: 'Harvest window predicted successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const userId = req.user ? req.user._id : null;
      if (!userId) {
        return sendSuccess(res, {
          message: 'Crop recommendation history retrieved',
          data: { history: [], pagination: { page: 1, limit: 10, totalRecords: 0, totalPages: 1 } }
        });
      }
      const result = await service.getRecommendationHistory(userId, req.query);
      return sendSuccess(res, {
        message: 'Crop recommendation history retrieved',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CropRecommendationController();

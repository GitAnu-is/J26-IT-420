const service = require('../services/transportationRiskService');
const { sendSuccess } = require('../../../shared/utils/apiResponse');
const { NotFoundError } = require('../../../shared/errors/AppError');
const { SUPPORTED_CROP_LIST } = require('../../../shared/constants/crops');
const { VEHICLE_TYPES, PACKAGING_TYPES, ROAD_CONDITIONS } = require('../validators/transportationRiskValidator');

const { getModelProvenance } = require('../../../shared/constants/modelProvenance');

/**
 * Controller for Component 4: Transportation Risk Prediction and Smart Packaging Recommendation
 */
class TransportationRiskController {
  async getComponentInfo(req, res) {
    return sendSuccess(res, {
      message: 'Component 4: AI-Based Transportation Risk Prediction and Smart Packaging Recommendation System',
      data: {
        componentId: 'C4',
        status: 'active',
        supportedCrops: SUPPORTED_CROP_LIST,
        supportedVehicles: VEHICLE_TYPES,
        supportedPackaging: PACKAGING_TYPES,
        supportedRoadConditions: ROAD_CONDITIONS,
        models: {
          riskClassification: ['Random Forest', 'XGBoost', 'CatBoost', 'Gradient Boosting'],
          selectedModel: 'Gradient Boosting Classifier (Calibrated & Low Latency)',
          explainability: 'SHAP (SHapley Additive exPlanations) TreeExplainer'
        },
        riskLevels: ['LOW', 'MEDIUM', 'HIGH'],
        independenceRule: 'Operates independently without requiring crop quality grading, market readiness, or shelf-life estimation.',
        researchProvenance: getModelProvenance('C4_TRANSPORTATION_RISK'),
        endpoints: {
          predictRisk: 'POST /api/v1/transportation/predict-risk',
          recommendPackaging: 'POST /api/v1/transportation/recommend-packaging',
          history: 'GET /api/v1/transportation/history',
          assessmentById: 'GET /api/v1/transportation/assessments/:id'
        },
        phaseStatus: 'Phase 6 Integration Verified. Machine Learning microservice operational on port 8003.'
      }
    });
  }

  async predictRisk(req, res, next) {
    try {
      const user = req.user || null;
      const result = await service.predictRisk(req.body, user);
      return sendSuccess(res, {
        message: 'Transportation risk prediction calculated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async recommendPackaging(req, res, next) {
    try {
      const result = await service.recommendPackaging(req.body);
      return sendSuccess(res, {
        message: 'Smart packaging recommendations generated successfully',
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
          message: 'Transportation risk history retrieved',
          data: { history: [], pagination: { page: 1, limit: 10, totalRecords: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false } }
        });
      }
      const result = await service.getHistory(userId, req.query);
      return sendSuccess(res, {
        message: 'Transportation risk history retrieved',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getAssessmentById(req, res, next) {
    try {
      const userId = req.user ? req.user._id : null;
      const assessment = await service.getAssessmentById(userId, req.params.id);
      if (!assessment) {
        throw new NotFoundError(`Transportation assessment with ID '${req.params.id}' not found`);
      }
      return sendSuccess(res, {
        message: 'Transportation assessment retrieved successfully',
        data: { assessment }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TransportationRiskController();

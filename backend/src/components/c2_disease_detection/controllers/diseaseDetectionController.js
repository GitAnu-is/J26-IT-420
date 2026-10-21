const service = require('../services/diseaseDetectionService');
const imageStorageService = require('../services/imageStorageService');
const { sendSuccess } = require('../../../shared/utils/apiResponse');
const { NotFoundError, ForbiddenError } = require('../../../shared/errors/AppError');
const { SUPPORTED_CROP_LIST } = require('../../../shared/constants/crops');

const { getModelProvenance } = require('../../../shared/constants/modelProvenance');

/**
 * Controller for Component 2: Plant Disease Detection and Severity Assessment
 */
class DiseaseDetectionController {
  async getComponentInfo(req, res) {
    return sendSuccess(res, {
      message: 'Component 2: AI-Based Plant Disease Detection and Severity Assessment System',
      data: {
        componentId: 'C2',
        status: 'active',
        supportedCrops: SUPPORTED_CROP_LIST,
        models: {
          proposed: 'EfficientNet-B0 (Transfer Learning)',
          comparison: 'ResNet50 (Transfer Learning)',
          detectionAndSeverity: ['EfficientNet-B0', 'ResNet50'],
          explainability: 'Grad-CAM Visual Heatmap Generation'
        },
        supportedDiseases: {
          BANANA: ['Healthy Foliage', 'Sigatoka Leaf Spot', 'Banana Bunchy Top Virus (BBTV)'],
          PINEAPPLE: ['Healthy Foliage', 'Heart Rot / Top Rot (Phytophthora nicotianae)'],
          BLACK_PEPPER: ['Healthy Foliage', 'Quick Wilt / Foot Rot (Phytophthora capsici)', 'Pollu Disease / Anthracnose']
        },
        severityLevels: ['Low', 'Medium', 'High'],
        researchProvenance: getModelProvenance('C2_DISEASE_DETECTION'),
        endpoints: {
          analyze: 'POST /api/v1/diseases/analyze',
          history: 'GET /api/v1/diseases/history',
          assessmentById: 'GET /api/v1/diseases/assessments/:id',
          gradcam: 'GET /api/v1/diseases/assessments/:id/gradcam',
          originalImage: 'GET /api/v1/diseases/assessments/:id/image'
        },
        phaseStatus: 'Phase 6 Integration Verified. Deep Learning microservice operational on port 8002.'
      }
    });
  }

  async analyze(req, res, next) {
    try {
      const user = req.user || null;
      const result = await service.analyzeDisease(req.body, req.file, user);
      return sendSuccess(res, {
        message: 'Disease analysis completed successfully',
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
          message: 'Disease assessment history retrieved',
          data: { history: [], pagination: { page: 1, limit: 10, totalRecords: 0, totalPages: 1 } }
        });
      }
      const result = await service.getHistory(userId, req.query);
      return sendSuccess(res, {
        message: 'Disease assessment history retrieved',
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
        throw new NotFoundError(`Disease assessment with ID '${req.params.id}' not found`);
      }
      return sendSuccess(res, {
        message: 'Disease assessment retrieved',
        data: { assessment }
      });
    } catch (error) {
      next(error);
    }
  }

  async getGradCamArtifact(req, res, next) {
    try {
      const userId = req.user ? req.user._id : null;
      const assessment = await service.getAssessmentById(userId, req.params.id);
      if (!assessment) {
        throw new NotFoundError(`Disease assessment with ID '${req.params.id}' not found`);
      }

      if (!assessment.gradCamArtifactReference) {
        throw new NotFoundError('No Grad-CAM explanation artifact associated with this assessment');
      }

      const safePath = imageStorageService.getFilePath(assessment.gradCamArtifactReference, 'gradcam');
      return res.sendFile(safePath);
    } catch (error) {
      next(error);
    }
  }

  async getOriginalImageArtifact(req, res, next) {
    try {
      const userId = req.user ? req.user._id : null;
      const assessment = await service.getAssessmentById(userId, req.params.id);
      if (!assessment) {
        throw new NotFoundError(`Disease assessment with ID '${req.params.id}' not found`);
      }

      if (!assessment.imageReference) {
        throw new NotFoundError('No image artifact reference associated with this assessment');
      }

      const safePath = imageStorageService.getFilePath(assessment.imageReference, 'original');
      return res.sendFile(safePath);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DiseaseDetectionController();

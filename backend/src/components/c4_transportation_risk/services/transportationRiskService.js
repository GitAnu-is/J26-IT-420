const mongoose = require('mongoose');
const adapter = require('../adapters/c4PythonInferenceAdapter');
const TransportationAssessment = require('../models/TransportationAssessment');
const Farm = require('../../../shared/models/Farm');
const { ROLES } = require('../../../shared/constants/roles');
const { NotFoundError, ForbiddenError } = require('../../../shared/errors/AppError');
const { logger } = require('../../../shared/utils/logger');

/**
 * Component 4 Service: Transportation Risk Prediction and Smart Packaging Recommendation
 */
class TransportationRiskService {
  /**
   * Predict transportation damage probability, risk category, SHAP explanation, and packaging guidance
   * @param {object} data
   * @param {object|null} user Authenticated user (if present)
   */
  async predictRisk(data, user = null) {
    let validatedFarm = null;

    // Optional farmId check and ownership verification
    if (data.farmId) {
      if (!mongoose.Types.ObjectId.isValid(data.farmId)) {
        throw new NotFoundError(`Farm with ID '${data.farmId}' not found`);
      }
      validatedFarm = await Farm.findOne({ _id: data.farmId, isArchived: false });
      if (!validatedFarm) {
        throw new NotFoundError(`Farm with ID '${data.farmId}' not found`);
      }

      if (user && user.role !== ROLES.ADMIN && validatedFarm.ownerId.toString() !== user._id.toString()) {
        throw new ForbiddenError('You do not have permission to access this farm record');
      }
    }

    // Call internal C4 Python inference adapter
    const inferenceResult = await adapter.requestRiskPrediction(data);

    // If user is authenticated, persist assessment to MongoDB
    let savedAssessmentId = null;
    if (user && user._id) {
      try {
        const pkg = inferenceResult.packagingRecommendation || inferenceResult.smartPackaging || {};
        const assessmentDoc = await TransportationAssessment.create({
          userId: user._id,
          farmId: validatedFarm ? validatedFarm._id : (data.farmId || null),
          cropType: inferenceResult.cropType,
          logisticsInputSnapshot: { ...data },
          predictionResult: {
            damageProbability: inferenceResult.damageProbability ?? null,
            riskLevel: inferenceResult.riskLevel ?? null,
            riskStatus: inferenceResult.riskStatus || 'COMPLETED',
            recommendedPackaging: pkg.recommendedPackaging || null,
            storageGuidance: pkg.storageGuidance || [],
            handlingGuidance: pkg.handlingGuidance || [],
            transportationGuidance: pkg.transportationGuidance || [],
            guidance: [
              ...(pkg.storageGuidance || []),
              ...(pkg.handlingGuidance || []),
              ...(pkg.transportationGuidance || [])
            ],
            ruleId: pkg.ruleId || null,
            supportingReferences: pkg.supportingReferences || []
          },
          shapExplanationMetadata: inferenceResult.shapExplanation || null,
          modelMetadata: {
            modelName: inferenceResult.modelIdentifier || 'Gradient Boosting',
            modelVersion: inferenceResult.modelVersion || '1.0.0',
            datasetVersion: '1.0.0'
          }
        });
        savedAssessmentId = assessmentDoc._id;
      } catch (dbErr) {
        logger.error({ error: dbErr.message }, 'Failed to persist transportation assessment to MongoDB');
      }
    }

    return {
      ...inferenceResult,
      assessmentId: savedAssessmentId
    };
  }

  /**
   * Smart packaging recommendation independent of risk prediction
   * @param {object} data
   */
  async recommendPackaging(data) {
    return await adapter.requestPackagingRecommendation(data);
  }

  /**
   * Retrieve historical transportation assessments for authenticated user
   * @param {string} userId
   * @param {object} query
   */
  async getHistory(userId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { userId };
    if (query.cropType) {
      filter.cropType = query.cropType.toUpperCase();
    }
    if (query.riskLevel) {
      filter['predictionResult.riskLevel'] = query.riskLevel.toUpperCase();
    }

    const [history, totalCount] = await Promise.all([
      TransportationAssessment.find(filter).sort({ timestamp: -1, createdAt: -1 }).skip(skip).limit(limit),
      TransportationAssessment.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      history,
      pagination: {
        page,
        limit,
        totalRecords: totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Retrieve specific authorized transportation assessment by ID
   * @param {object|null} user
   * @param {string} id
   */
  async getAssessmentById(user, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundError(`Transportation assessment with ID '${id}' not found`);
    }

    const assessment = await TransportationAssessment.findById(id);
    if (!assessment) {
      throw new NotFoundError(`Transportation assessment with ID '${id}' not found`);
    }

    if (!user || (user.role !== ROLES.ADMIN && assessment.userId.toString() !== user._id.toString())) {
      throw new ForbiddenError('You do not have permission to view this assessment');
    }

    return assessment;
  }
}

module.exports = new TransportationRiskService();

const Farm = require('../models/Farm');
const AgriculturalRecord = require('../models/AgriculturalRecord');
const CropPrediction = require('../../components/c1_crop_recommendation/models/CropPrediction');
const DiseaseAssessment = require('../../components/c2_disease_detection/models/DiseaseAssessment');
const TransportationAssessment = require('../../components/c4_transportation_risk/models/TransportationAssessment');
const { env } = require('../../config/env');
const { ROLES } = require('../constants/roles');
const { NotFoundError, ForbiddenError } = require('../errors/AppError');

class FarmService {
  /**
   * Create a new farm registration
   * @param {string} ownerId
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createFarm(ownerId, data) {
    const farm = await Farm.create({
      ...data,
      ownerId
    });
    return farm;
  }

  /**
   * List farms with ownership filtering and pagination
   * @param {object} user Authenticated user
   * @param {object} query Pagination & filter query parameters
   * @returns {Promise<{ farms: Array, pagination: object }>}
   */
  async listFarms(user, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { isArchived: false };

    // Strict ownership: Only ADMIN can query arbitrary ownerId. All other roles only view their own farms
    if (user.role !== ROLES.ADMIN) {
      filter.ownerId = user._id;
    } else if (query.ownerId) {
      filter.ownerId = query.ownerId;
    }

    if (query.district) {
      filter.district = new RegExp(query.district, 'i');
    }

    const [farms, totalCount] = await Promise.all([
      Farm.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Farm.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return {
      farms,
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
   * Retrieve single farm by ID with ownership enforcement
   * @param {object} user
   * @param {string} farmId
   * @returns {Promise<object>}
   */
  async getFarmById(user, farmId) {
    const farm = await Farm.findOne({ _id: farmId, isArchived: false });
    if (!farm) {
      throw new NotFoundError(`Farm with ID '${farmId}' not found`);
    }

    // Check ownership: Only farm owner or ADMIN can view
    if (
      user.role !== ROLES.ADMIN &&
      farm.ownerId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenError('You do not have permission to view this farm record');
    }

    return farm;
  }

  /**
   * Update farm details with ownership check
   * @param {object} user
   * @param {string} farmId
   * @param {object} data
   * @returns {Promise<object>}
   */
  async updateFarm(user, farmId, data) {
    const farm = await Farm.findOne({ _id: farmId, isArchived: false });
    if (!farm) {
      throw new NotFoundError(`Farm with ID '${farmId}' not found`);
    }

    // Only farm owner or platform admin can update
    if (
      user.role !== ROLES.ADMIN &&
      farm.ownerId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenError('You do not have permission to modify this farm record');
    }

    // Apply updates safely
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && key !== 'ownerId' && key !== 'isArchived') {
        farm[key] = data[key];
      }
    });

    await farm.save();
    return farm;
  }

  /**
   * Soft delete farm with ownership check
   * @param {object} user
   * @param {string} farmId
   * @returns {Promise<{ success: boolean }>}
   */
  async deleteFarm(user, farmId) {
    const farm = await Farm.findOne({ _id: farmId, isArchived: false });
    if (!farm) {
      throw new NotFoundError(`Farm with ID '${farmId}' not found`);
    }

    if (
      user.role !== ROLES.ADMIN &&
      farm.ownerId.toString() !== user._id.toString()
    ) {
      throw new ForbiddenError('You do not have permission to delete this farm record');
    }

    farm.isArchived = true;
    farm.archivedAt = new Date();
    await farm.save();

    return { success: true };
  }

  /**
   * Consolidated overview of farm context, agricultural records, and latest research assessments
   * @param {object} user
   * @param {string} farmId
   * @returns {Promise<object>}
   */
  async getFarmOverview(user, farmId) {
    const farm = await this.getFarmById(user, farmId);

    const [agriculturalRecords, latestCrop, latestDisease, latestTransport] = await Promise.all([
      AgriculturalRecord.find({ farmId: farm._id, isArchived: false })
        .sort({ recordedAt: -1, createdAt: -1 })
        .limit(10),
      CropPrediction.findOne({ farmId: farm._id })
        .sort({ timestamp: -1, createdAt: -1 }),
      DiseaseAssessment.findOne({ farmId: farm._id })
        .sort({ timestamp: -1, createdAt: -1 }),
      TransportationAssessment.findOne({ farmId: farm._id })
        .sort({ timestamp: -1, createdAt: -1 })
    ]);

    return {
      farm,
      agriculturalRecordsSummary: {
        totalLoaded: agriculturalRecords.length,
        records: agriculturalRecords
      },
      latestAssessments: {
        cropRecommendation: latestCrop
          ? {
              status: 'AVAILABLE',
              id: latestCrop._id,
              cropType: latestCrop.cropType,
              predictionType: latestCrop.predictionType,
              result: latestCrop.predictionResult,
              timestamp: latestCrop.timestamp
            }
          : { status: 'NO_RECORDS', message: 'No crop recommendations recorded for this farm' },
        diseaseDetection: latestDisease
          ? {
              status: 'AVAILABLE',
              id: latestDisease._id,
              cropType: latestDisease.cropType,
              diseaseName: latestDisease.predictionResult?.diseaseName,
              confidence: latestDisease.predictionResult?.confidence,
              severity: latestDisease.predictionResult?.severity,
              severityStatus: latestDisease.predictionResult?.severityStatus,
              hasGradCam: Boolean(latestDisease.gradCamArtifactReference),
              timestamp: latestDisease.timestamp
            }
          : { status: 'NO_RECORDS', message: 'No disease assessments recorded for this farm' },
        transportationRisk: latestTransport
          ? {
              status: 'AVAILABLE',
              id: latestTransport._id,
              cropType: latestTransport.cropType,
              damageProbability: latestTransport.predictionResult?.damageProbability,
              riskLevel: latestTransport.predictionResult?.riskLevel,
              recommendedPackaging: latestTransport.predictionResult?.recommendedPackaging,
              timestamp: latestTransport.timestamp
            }
          : { status: 'NO_RECORDS', message: 'No transportation risk assessments recorded for this farm' }
      },
      componentReadiness: {
        c1_crop_recommendation: {
          configured: Boolean(env.C1_PYTHON_SERVICE_URL),
          endpoint: '/api/v1/crops/recommend'
        },
        c2_disease_detection: {
          configured: Boolean(env.C2_PYTHON_SERVICE_URL),
          endpoint: '/api/v1/diseases/analyze'
        },
        c4_transportation_risk: {
          configured: Boolean(env.C4_PYTHON_SERVICE_URL),
          endpoint: '/api/v1/transportation/predict-risk'
        }
      }
    };
  }
}

module.exports = new FarmService();

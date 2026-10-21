const adapter = require('../adapters/c1PythonInferenceAdapter');
const weatherService = require('./weatherService');
const CropPrediction = require('../models/CropPrediction');
const Farm = require('../../../shared/models/Farm');
const { ROLES } = require('../../../shared/constants/roles');
const { NotFoundError, ForbiddenError } = require('../../../shared/errors/AppError');
const { logger } = require('../../../shared/utils/logger');

/**
 * Component 1 Service: Business logic for Crop Recommendation & Harvest Planning
 */
class CropRecommendationService {
  /**
   * Recommend optimal crop based on soil chemistry, location, and environmental data
   * @param {object} inputData
   * @param {object|null} user Authenticated user (if present)
   * @returns {Promise<object>} Recommendation result
   */
  async recommendCrop(inputData, user = null) {
    const enrichedData = { ...inputData };
    let validatedFarm = null;

    // 1. Farm context & ownership check if farmId is provided
    if (enrichedData.farmId) {
      validatedFarm = await Farm.findOne({ _id: enrichedData.farmId, isArchived: false });
      if (!validatedFarm) {
        throw new NotFoundError(`Farm with ID '${enrichedData.farmId}' not found`);
      }

      if (user && user.role !== ROLES.ADMIN && validatedFarm.ownerId.toString() !== user._id.toString()) {
        throw new ForbiddenError('You do not have permission to access this farm record');
      }

      // Inherit farm attributes if not explicitly supplied in request
      if (!enrichedData.district && validatedFarm.district) {
        enrichedData.district = validatedFarm.district;
      }
      if (!enrichedData.agroEcologicalZone && validatedFarm.agroEcologicalZone) {
        enrichedData.agroEcologicalZone = validatedFarm.agroEcologicalZone;
      }
      if (validatedFarm.location && validatedFarm.location.latitude && validatedFarm.location.longitude) {
        if (enrichedData.latitude === undefined) enrichedData.latitude = validatedFarm.location.latitude;
        if (enrichedData.longitude === undefined) enrichedData.longitude = validatedFarm.location.longitude;
      }
    }

    // 2. OpenWeather meteorological feature enrichment
    let weatherObservation = null;
    if (enrichedData.latitude !== undefined || enrichedData.longitude !== undefined || enrichedData.district) {
      weatherObservation = await weatherService.getWeatherForLocation({
        latitude: enrichedData.latitude,
        longitude: enrichedData.longitude,
        district: enrichedData.district
      });

      if (weatherObservation) {
        if (enrichedData.temperature === undefined && weatherObservation.temperature !== null) {
          enrichedData.temperature = weatherObservation.temperature;
        }
        if (enrichedData.humidity === undefined && weatherObservation.humidity !== null) {
          enrichedData.humidity = weatherObservation.humidity;
        }
        if (enrichedData.rainfall === undefined && weatherObservation.rainfall !== null) {
          enrichedData.rainfall = weatherObservation.rainfall;
        }
      }
    }

    // 3. Delegate to C1 Python Inference Adapter
    const predictionResult = await adapter.requestCropRecommendation(enrichedData);

    // 4. Persist successful recommendation if authenticated user
    let savedPredictionId = null;
    if (user && user._id) {
      try {
        const savedDoc = await CropPrediction.create({
          userId: user._id,
          farmId: enrichedData.farmId || null,
          predictionType: 'CROP_RECOMMENDATION',
          cropType: predictionResult.recommendedCrop,
          inputSnapshot: enrichedData,
          predictionResult: {
            ...predictionResult,
            weatherObservation
          },
          modelMetadata: {
            modelName: predictionResult.modelIdentifier || 'Random Forest Classifier',
            modelVersion: predictionResult.modelVersion || 'v1.0'
          },
          timestamp: new Date()
        });
        savedPredictionId = savedDoc._id.toString();
      } catch (err) {
        logger.error({ error: err.message }, 'Failed to persist crop recommendation history record');
      }
    }

    return {
      ...predictionResult,
      farmId: enrichedData.farmId || null,
      weatherProvenance: weatherObservation ? weatherObservation.provenance : null,
      savedPredictionId
    };
  }

  /**
   * Predict expected harvest duration, date, and practical harvest window
   * @param {object} inputData
   * @param {object|null} user Authenticated user (if present)
   * @returns {Promise<object>} Harvest prediction result
   */
  async predictHarvestWindow(inputData, user = null) {
    const enrichedData = { ...inputData };
    let validatedFarm = null;

    // Validate farm ownership if farmId provided
    if (enrichedData.farmId) {
      validatedFarm = await Farm.findOne({ _id: enrichedData.farmId, isArchived: false });
      if (!validatedFarm) {
        throw new NotFoundError(`Farm with ID '${enrichedData.farmId}' not found`);
      }

      if (user && user.role !== ROLES.ADMIN && validatedFarm.ownerId.toString() !== user._id.toString()) {
        throw new ForbiddenError('You do not have permission to access this farm record');
      }

      if (!enrichedData.district && validatedFarm.district) {
        enrichedData.district = validatedFarm.district;
      }
    }

    // Delegate to C1 Python Inference Adapter
    const predictionResult = await adapter.requestHarvestPrediction(enrichedData);

    // Persist successful harvest prediction if authenticated
    let savedPredictionId = null;
    if (user && user._id) {
      try {
        const savedDoc = await CropPrediction.create({
          userId: user._id,
          farmId: enrichedData.farmId || null,
          predictionType: 'HARVEST_TIME',
          cropType: enrichedData.crop,
          inputSnapshot: enrichedData,
          predictionResult,
          modelMetadata: {
            modelName: predictionResult.modelIdentifier || 'Random Forest Regressor',
            modelVersion: predictionResult.modelVersion || 'v1.0'
          },
          timestamp: new Date()
        });
        savedPredictionId = savedDoc._id.toString();
      } catch (err) {
        logger.error({ error: err.message }, 'Failed to persist harvest prediction history record');
      }
    }

    return {
      ...predictionResult,
      farmId: enrichedData.farmId || null,
      savedPredictionId
    };
  }

  /**
   * Query historical crop and harvest predictions for authenticated user
   * @param {string} userId
   * @param {object} query Pagination and filter params
   * @returns {Promise<{ history: Array, pagination: object }>}
   */
  async getRecommendationHistory(userId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = { userId };
    if (query.predictionType) {
      filter.predictionType = query.predictionType;
    }
    if (query.cropType) {
      filter.cropType = query.cropType;
    }
    if (query.farmId) {
      filter.farmId = query.farmId;
    }

    const [history, totalCount] = await Promise.all([
      CropPrediction.find(filter)
        .populate('farmId', 'farmName district supportedCrops')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      CropPrediction.countDocuments(filter)
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
}

module.exports = new CropRecommendationService();

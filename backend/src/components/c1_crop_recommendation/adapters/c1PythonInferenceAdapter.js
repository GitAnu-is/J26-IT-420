const { NotImplementedError, ServiceUnavailableError, ValidationError } = require('../../../shared/errors/AppError');
const { logger } = require('../../../shared/utils/logger');
const { env } = require('../../../config/env');

/**
 * C1 Python Machine Learning Inference Adapter
 * Handles HTTP communication with the internal Python ML microservice:
 * 1. Random Forest Classifier for Crop Recommendation (/predict/crop)
 * 2. Random Forest Regressor for Harvest Window Prediction (/predict/harvest)
 */
class C1PythonInferenceAdapter {
  constructor() {
    this.serviceUrl = env.C1_PYTHON_SERVICE_URL || '';
    this.internalKey = env.C1_PYTHON_SERVICE_KEY || '';
    this.timeoutMs = env.C1_INFERENCE_TIMEOUT_MS || 15000;
  }

  /**
   * Request crop recommendation from Python ML service
   * @param {object} input Features prepared for ML inference
   * @returns {Promise<object>}
   */
  async requestCropRecommendation(input) {
    logger.info({ adapter: 'C1PythonInferenceAdapter', action: 'requestCropRecommendation' }, 'Invoking C1 crop recommendation inference adapter');

    if (!this.serviceUrl) {
      throw new NotImplementedError(
        'Component 1 (Crop Recommendation ML Model) is not yet active. Python inference service URL is not configured.'
      );
    }

    const payload = {
      nitrogen: input.nitrogen,
      phosphorus: input.phosphorus,
      potassium: input.potassium,
      ph: input.ph,
      soil_moisture: input.moisture !== undefined ? input.moisture : (input.soil_moisture !== undefined ? input.soil_moisture : null),
      temperature: input.temperature !== undefined ? input.temperature : null,
      humidity: input.humidity !== undefined ? input.humidity : null,
      rainfall: input.rainfall !== undefined ? input.rainfall : null,
      district: input.district || null,
      agro_zone: input.agroEcologicalZone || input.agro_zone || null,
      season: input.season || null
    };

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.internalKey) {
        headers['X-Internal-Service-Key'] = this.internalKey;
      }

      const response = await fetch(`${this.serviceUrl}/predict/crop`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeoutMs)
      });

      if (!response.ok) {
        if (response.status === 501) {
          throw new NotImplementedError('Component 1 Crop Recommendation ML model is not implemented on the inference server.');
        }
        if (response.status === 503) {
          throw new ServiceUnavailableError('Component 1 Crop Recommendation ML model is temporarily unavailable on the inference server.');
        }
        const errorBody = await response.text();
        logger.error({ status: response.status, body: errorBody }, 'C1 crop inference microservice returned error status');
        throw new ServiceUnavailableError(`Inference service error (${response.status}): ${errorBody}`);
      }

      const result = await response.json();

      // Output validation
      if (!result.recommendedCrop || typeof result.confidence !== 'number') {
        throw new ValidationError('Malformed prediction response from machine learning service', [
          { field: 'recommendedCrop', message: 'Missing or invalid crop recommendation in ML response' }
        ]);
      }

      return result;
    } catch (err) {
      if (err instanceof NotImplementedError || err instanceof ValidationError || err instanceof ServiceUnavailableError) {
        throw err;
      }
      logger.info({ error: err.message }, 'C1 crop recommendation service is unreachable; returning 501 boundary');
      throw new NotImplementedError(
        `Component 1 (Crop Recommendation ML Model) is not yet active or Python inference service is unreachable at ${this.serviceUrl}.`
      );
    }
  }

  /**
   * Request harvest time prediction from Python ML service
   * @param {object} input Features prepared for harvest regressor
   * @returns {Promise<object>}
   */
  async requestHarvestPrediction(input) {
    logger.info({ adapter: 'C1PythonInferenceAdapter', action: 'requestHarvestPrediction' }, 'Invoking C1 harvest regressor adapter');

    if (!this.serviceUrl) {
      throw new NotImplementedError(
        'Component 1 (Harvest Prediction ML Model) is not yet active. Python inference service URL is not configured.'
      );
    }

    const payload = {
      cropType: input.crop || input.cropType,
      plantingDate: input.plantingDate,
      variety: input.variety || null,
      district: input.district || null,
      season: input.season || null,
      soilPh: input.ph !== undefined ? input.ph : (input.soilPh !== undefined ? input.soilPh : null),
      soilMoisture: input.soilMoisture !== undefined ? input.soilMoisture : null,
      temperature: input.temperature !== undefined ? input.temperature : null,
      rainfall: input.rainfall !== undefined ? input.rainfall : null
    };

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.internalKey) {
        headers['X-Internal-Service-Key'] = this.internalKey;
      }

      const response = await fetch(`${this.serviceUrl}/predict/harvest`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeoutMs)
      });

      if (!response.ok) {
        if (response.status === 501) {
          throw new NotImplementedError('Component 1 Harvest Prediction ML model is not implemented on the inference server.');
        }
        if (response.status === 503) {
          throw new ServiceUnavailableError('Component 1 Harvest Prediction ML model is temporarily unavailable on the inference server.');
        }
        const errorBody = await response.text();
        logger.error({ status: response.status, body: errorBody }, 'C1 harvest inference microservice returned error status');
        throw new ServiceUnavailableError(`Inference service error (${response.status}): ${errorBody}`);
      }

      const result = await response.json();

      if (!result.cropType || typeof result.predictedDurationDays !== 'number' || !result.predictedHarvestDate) {
        throw new ValidationError('Malformed prediction response from harvest prediction service', [
          { field: 'predictedDurationDays', message: 'Missing duration or harvest date in response' }
        ]);
      }

      return result;
    } catch (err) {
      if (err instanceof NotImplementedError || err instanceof ValidationError || err instanceof ServiceUnavailableError) {
        throw err;
      }
      logger.info({ error: err.message }, 'C1 harvest prediction service is unreachable; returning 501 boundary');
      throw new NotImplementedError(
        `Component 1 (Harvest Prediction ML Model) is not yet active or Python inference service is unreachable at ${this.serviceUrl}.`
      );
    }
  }
}

module.exports = new C1PythonInferenceAdapter();

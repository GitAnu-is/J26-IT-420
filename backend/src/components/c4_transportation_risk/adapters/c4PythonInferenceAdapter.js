const { NotImplementedError, ServiceUnavailableError, ValidationError } = require('../../../shared/errors/AppError');
const { logger } = require('../../../shared/utils/logger');
const { env } = require('../../../config/env');

/**
 * C4 Python Machine Learning Inference Adapter
 * Handles communication with internal Python ML microservice hosting:
 * 1. Transportation Damage Probability & Risk Level (Random Forest, XGBoost, CatBoost, Gradient Boosting)
 * 2. Smart Packaging Recommendation Engine
 * 3. SHAP Explainable AI Feature Attribution
 */
class C4PythonInferenceAdapter {
  constructor() {
    this.serviceUrl = env.C4_PYTHON_SERVICE_URL;
    this.serviceKey = env.C4_PYTHON_SERVICE_KEY || 'c4_internal_secret_key_change_in_production_12345';
    this.timeoutMs = env.C4_INFERENCE_TIMEOUT_MS || 15000;
    this.supportedModels = ['Random Forest', 'XGBoost', 'CatBoost', 'Gradient Boosting'];
    this.xaiMethod = 'SHAP (TreeExplainer)';
  }

  /**
   * Request damage probability, risk level, and SHAP explainability
   * @param {object} input
   * @returns {Promise<object>}
   */
  async requestRiskPrediction(input) {
    const cropType = input.crop || input.cropType;
    logger.info({ adapter: 'C4PythonInferenceAdapter', action: 'requestRiskPrediction', crop: cropType }, 'Invoking C4 ML risk prediction adapter');

    if (!this.serviceUrl) {
      throw new NotImplementedError(
        'Component 4 Python ML service URL is not configured. Transportation risk prediction requires an active microservice.'
      );
    }

    const payload = {
      cropType,
      distanceKm: Number(input.distanceKm),
      durationHours: Number(input.durationHours),
      vehicleType: String(input.vehicleType).toUpperCase(),
      roadCondition: String(input.roadCondition).toUpperCase(),
      packagingType: String(input.packagingType).toUpperCase(),
      temperatureCelsius: input.temperatureCelsius !== undefined && input.temperatureCelsius !== null ? Number(input.temperatureCelsius) : null,
      humidityPercentage: input.humidityPercentage !== undefined && input.humidityPercentage !== null ? Number(input.humidityPercentage) : null,
      originDistrict: input.originDistrict || null,
      destinationDistrict: input.destinationDistrict || null
    };

    let response;
    try {
      response = await fetch(`${this.serviceUrl}/predict/risk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': this.serviceKey
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeoutMs)
      });
    } catch (err) {
      if (err instanceof NotImplementedError || err instanceof ValidationError || err instanceof ServiceUnavailableError) {
        throw err;
      }
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        logger.error({ timeoutMs: this.timeoutMs }, 'C4 Python inference service request timed out');
        throw new ServiceUnavailableError('Component 4 Python inference microservice request timed out.');
      }
      logger.info({ error: err.message }, 'C4 transportation service is unreachable; returning 501 boundary');
      throw new NotImplementedError(
        `Component 4 (Transportation Risk Prediction & Smart Packaging ML Model) is not yet active or Python inference service is unreachable at ${this.serviceUrl}.`
      );
    }

    if (!response.ok) {
      let errorBody = {};
      try {
        errorBody = await response.json();
      } catch (_) {}
      const detail = errorBody.detail || `Inference service responded with HTTP status ${response.status}`;

      if (response.status === 501) {
        throw new NotImplementedError(`Component 4 inference not implemented: ${detail}`);
      }
      if (response.status === 503) {
        throw new ServiceUnavailableError(`Component 4 Python inference microservice is currently unavailable: ${detail}`);
      }
      if (response.status === 400 || response.status === 422) {
        throw new ValidationError(`C4 inference validation error: ${JSON.stringify(detail)}`);
      }
      throw new ServiceUnavailableError(`C4 Python inference service error: ${detail}`);
    }

    const result = await response.json();

    // Response contract validation
    if (result.damageProbability === undefined || !result.riskLevel || !result.riskStatus) {
      logger.error({ result }, 'Malformed prediction payload received from C4 inference service');
      throw new ValidationError('Malformed response received from C4 Python ML microservice.');
    }

    return {
      cropType: result.cropType,
      damageProbability: result.damageProbability,
      riskLevel: result.riskLevel,
      riskStatus: result.riskStatus,
      modelIdentifier: result.modelIdentifier,
      modelVersion: result.modelVersion,
      datasetVersion: result.datasetVersion || 'v1.0',
      shapExplanation: result.shapExplanation,
      packagingRecommendation: result.packagingRecommendation,
      executionLatencyMs: result.executionLatencyMs,
      timestamp: result.timestamp
    };
  }

  /**
   * Request smart packaging recommendations
   * @param {object} input
   * @returns {Promise<object>}
   */
  async requestPackagingRecommendation(input) {
    const cropType = input.crop || input.cropType;
    logger.info({ adapter: 'C4PythonInferenceAdapter', action: 'requestPackagingRecommendation', crop: cropType }, 'Invoking C4 packaging recommendation adapter');

    if (!this.serviceUrl) {
      throw new NotImplementedError(
        'Component 4 Python ML service URL is not configured. Smart packaging recommendation requires an active microservice.'
      );
    }

    const payload = {
      cropType,
      distanceKm: Number(input.distanceKm),
      vehicleType: input.vehicleType ? String(input.vehicleType).toUpperCase() : null,
      expectedDurationHours: input.expectedDurationHours ? Number(input.expectedDurationHours) : null,
      currentPackagingType: input.currentPackagingType || input.packagingType || null,
      temperatureCelsius: input.temperatureCelsius !== undefined && input.temperatureCelsius !== null ? Number(input.temperatureCelsius) : null,
      humidityPercentage: input.humidityPercentage !== undefined && input.humidityPercentage !== null ? Number(input.humidityPercentage) : null
    };

    let response;
    try {
      response = await fetch(`${this.serviceUrl}/recommend/packaging`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': this.serviceKey
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeoutMs)
      });
    } catch (err) {
      if (err instanceof NotImplementedError || err instanceof ValidationError || err instanceof ServiceUnavailableError) {
        throw err;
      }
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        logger.error({ timeoutMs: this.timeoutMs }, 'C4 packaging recommendation service request timed out');
        throw new ServiceUnavailableError('Component 4 packaging recommendation service request timed out.');
      }
      logger.info({ error: err.message }, 'C4 packaging service is unreachable; returning 501 boundary');
      throw new NotImplementedError(
        `Component 4 (Smart Packaging Recommendation Engine) is not yet active or Python service is unreachable at ${this.serviceUrl}.`
      );
    }

    if (!response.ok) {
      let errorBody = {};
      try {
        errorBody = await response.json();
      } catch (_) {}
      const detail = errorBody.detail || `Packaging service responded with HTTP status ${response.status}`;

      if (response.status === 501) {
        throw new NotImplementedError(`Component 4 packaging not implemented: ${detail}`);
      }
      if (response.status === 503) {
        throw new ServiceUnavailableError(`Component 4 packaging recommendation service is currently unavailable: ${detail}`);
      }
      if (response.status === 400 || response.status === 422) {
        throw new ValidationError(`C4 packaging validation error: ${JSON.stringify(detail)}`);
      }
      throw new ServiceUnavailableError(`C4 packaging recommendation service error: ${detail}`);
    }

    return await response.json();
  }

  /**
   * Retrieve active model metadata from internal Python service
   */
  async getModelInfo() {
    if (!this.serviceUrl) {
      return null;
    }
    try {
      const res = await fetch(`${this.serviceUrl}/model-info`, {
        headers: { 'X-Internal-Service-Key': this.serviceKey },
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      logger.warn({ error: err.message }, 'Unable to fetch C4 model info from Python microservice');
    }
    return null;
  }
}

module.exports = new C4PythonInferenceAdapter();

const { NotImplementedError, ServiceUnavailableError, ValidationError } = require('../../../shared/errors/AppError');
const { logger } = require('../../../shared/utils/logger');
const { env } = require('../../../config/env');

/**
 * C2 Python Deep Learning Inference Adapter
 * Communicates with the internal Python FastAPI microservice (port 8002):
 * 1. EfficientNet-B0 (Proposed) and ResNet50 (Comparison) for Disease Classification
 * 2. Grad-CAM visual explainability heatmap generator
 * 3. Calibrated severity evaluator
 */
class C2PythonInferenceAdapter {
  constructor() {
    this.serviceUrl = env.C2_PYTHON_SERVICE_URL || '';
    this.internalKey = env.C2_PYTHON_SERVICE_KEY || 'c2_internal_secret_key_change_in_production_12345';
    this.timeoutMs = env.C2_INFERENCE_TIMEOUT_MS || 15000;
  }

  /**
   * Request disease detection, severity assessment, and Grad-CAM generation
   * @param {object} input { crop, cropType, imageBuffer, imageBase64, includeGradCam }
   * @returns {Promise<object>} Structured inference prediction
   */
  async requestDiseaseAnalysis(input) {
    const crop = input.crop || input.cropType;
    logger.info({ adapter: 'C2PythonInferenceAdapter', action: 'requestDiseaseAnalysis', crop }, 'Invoking C2 deep learning adapter');

    if (!this.serviceUrl) {
      throw new NotImplementedError(
        'Component 2 (Plant Disease Detection Deep Learning Model) is not yet active. Python inference service URL is not configured.'
      );
    }

    if (input.imageUrl && !input.imageBuffer && !input.imageBase64) {
      throw new NotImplementedError(
        'Component 2 (Plant Disease Detection Deep Learning Model) remote image URL ingestion is not implemented. Direct multipart image upload is required.'
      );
    }

    try {
      const headers = {};
      if (this.internalKey) {
        headers['X-Internal-Service-Key'] = this.internalKey;
      }

      let response;

      if (input.imageBuffer && Buffer.isBuffer(input.imageBuffer)) {
        // Native Node.js FormData multipart upload
        const formData = new FormData();
        const blob = new Blob([input.imageBuffer], { type: 'image/jpeg' });
        formData.append('image', blob, 'sample.jpg');
        formData.append('cropType', crop);
        formData.append('includeGradCam', input.includeGradCam !== false ? 'true' : 'false');

        response = await fetch(`${this.serviceUrl}/predict/disease`, {
          method: 'POST',
          headers,
          body: formData,
          signal: AbortSignal.timeout(this.timeoutMs)
        });
      } else if (input.imageBase64) {
        // JSON endpoint
        headers['Content-Type'] = 'application/json';
        const payload = {
          cropType: crop,
          imageBase64: input.imageBase64
        };

        response = await fetch(`${this.serviceUrl}/predict/disease-json`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(this.timeoutMs)
        });
      } else {
        throw new ValidationError('No valid image buffer or imageBase64 provided to C2 inference adapter');
      }

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 501) {
          throw new NotImplementedError('Component 2 disease detection model is not implemented on the inference server.');
        }
        if (response.status === 503) {
          throw new ServiceUnavailableError('Component 2 disease detection model is currently unavailable on the inference server.');
        }
        if (response.status === 400 || response.status === 422) {
          throw new ValidationError(`Inference service validation failure: ${errorText}`);
        }
        logger.error({ status: response.status, body: errorText }, 'C2 inference microservice returned error');
        throw new ServiceUnavailableError(`Inference service error (${response.status}): ${errorText}`);
      }

      const result = await response.json();

      // Output contract validation
      if (!result.predictedDisease || typeof result.confidence !== 'number') {
        throw new ValidationError('Malformed prediction response from disease detection machine learning service', [
          { field: 'predictedDisease', message: 'Missing predicted disease classification in response' }
        ]);
      }

      return result;
    } catch (err) {
      if (err instanceof NotImplementedError || err instanceof ValidationError || err instanceof ServiceUnavailableError) {
        throw err;
      }
      logger.warn({ error: err.message }, 'C2 deep learning service is unreachable or timed out; returning 503');
      throw new ServiceUnavailableError(
        `Component 2 (Plant Disease Detection Deep Learning Model) service is temporarily unreachable at ${this.serviceUrl}.`
      );
    }
  }

  /**
   * Request model metadata and readiness
   */
  async getModelInfo() {
    if (!this.serviceUrl) {
      return { status: 'unconfigured' };
    }
    const headers = {};
    if (this.internalKey) {
      headers['X-Internal-Service-Key'] = this.internalKey;
    }
    const res = await fetch(`${this.serviceUrl}/model-info`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(5000)
    });
    return await res.json();
  }
}

module.exports = new C2PythonInferenceAdapter();

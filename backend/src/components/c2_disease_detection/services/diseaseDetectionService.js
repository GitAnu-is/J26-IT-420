const mongoose = require('mongoose');
const adapter = require('../adapters/c2PythonInferenceAdapter');
const imageStorageService = require('./imageStorageService');
const DiseaseAssessment = require('../models/DiseaseAssessment');
const Farm = require('../../../shared/models/Farm');
const { ROLES } = require('../../../shared/constants/roles');
const { isValidCrop, normalizeCropName } = require('../../../shared/constants/crops');
const { NotFoundError, ForbiddenError, ValidationError } = require('../../../shared/errors/AppError');
const { logger } = require('../../../shared/utils/logger');

/**
 * Component 2 Service: Plant Disease Detection and Severity Assessment
 */
class DiseaseDetectionService {
  /**
   * Analyze plant image for disease detection and severity assessment
   * @param {object} data Form body fields (crop, cropType, farmId, agriculturalRecordId, imageBase64, etc.)
   * @param {object|null} file Multer uploaded file object (if present)
   * @param {object|null} user Authenticated user (if present)
   * @returns {Promise<object>} Analysis result and artifact references
   */
  async analyzeDisease(data, file = null, user = null) {
    const rawCrop = data.crop || data.cropType;
    if (!rawCrop) {
      throw new ValidationError('Target crop is required for disease analysis', [
        { field: 'crop', message: 'Crop parameter is missing' }
      ]);
    }

    if (!isValidCrop(rawCrop)) {
      throw new ValidationError(`Crop '${rawCrop}' is unsupported. Supported crops: BANANA, PINEAPPLE, BLACK_PEPPER`, [
        { field: 'crop', message: 'Unsupported crop selection' }
      ]);
    }

    const cropType = normalizeCropName(rawCrop);

    // 1. Validate Farm Context & Ownership if farmId provided
    let validatedFarm = null;
    if (data.farmId) {
      if (!mongoose.Types.ObjectId.isValid(data.farmId)) {
        throw new ValidationError(`Invalid farm ID format: '${data.farmId}'`, [
          { field: 'farmId', message: 'Invalid MongoDB ObjectId' }
        ]);
      }

      validatedFarm = await Farm.findOne({ _id: data.farmId, isArchived: false });
      if (!validatedFarm) {
        throw new NotFoundError(`Farm with ID '${data.farmId}' not found`);
      }

      if (user && user.role !== ROLES.ADMIN && validatedFarm.ownerId.toString() !== user._id.toString()) {
        throw new ForbiddenError('You do not have permission to associate assessments with this farm');
      }
    }

    // 2. Validate Agricultural Record Context if provided
    let validatedRecordId = null;
    if (data.agriculturalRecordId) {
      if (!mongoose.Types.ObjectId.isValid(data.agriculturalRecordId)) {
        throw new ValidationError(`Invalid agricultural record ID format: '${data.agriculturalRecordId}'`, [
          { field: 'agriculturalRecordId', message: 'Invalid MongoDB ObjectId' }
        ]);
      }
      validatedRecordId = data.agriculturalRecordId;
    }

    // 3. Image validation & secure local storage
    let imageBuffer = null;
    if (file && file.buffer) {
      imageBuffer = file.buffer;
    } else if (data.imageBase64 && typeof data.imageBase64 === 'string') {
      const cleanB64 = data.imageBase64.includes('base64,')
        ? data.imageBase64.split('base64,')[1]
        : data.imageBase64;
      try {
        imageBuffer = Buffer.from(cleanB64, 'base64');
      } catch (err) {
        throw new ValidationError('Invalid base64 image data payload');
      }
    } else if (data.imageUrl && typeof data.imageUrl === 'string') {
      // Delegate remote image URL to adapter to enforce SSRF/implementation boundary
      return await adapter.requestDiseaseAnalysis({
        crop: cropType,
        imageUrl: data.imageUrl
      });
    } else {
      throw new ValidationError('An image file (multipart) or valid imageBase64 string must be provided for disease analysis');
    }

    // Verify magic bytes and store original image
    const storedImage = await imageStorageService.saveOriginalImage(imageBuffer, file ? file.originalname : '');
    const originalImageKey = storedImage.key;

    // 4. Delegate to Python Deep Learning Inference Adapter
    let predictionResult;
    try {
      predictionResult = await adapter.requestDiseaseAnalysis({
        crop: cropType,
        imageBuffer,
        includeGradCam: true
      });
    } catch (err) {
      // Clean up original stored image on inference failure to avoid orphaned files
      await imageStorageService.deleteArtifact(originalImageKey, 'original');
      throw err;
    }

    // 5. Store Grad-CAM visualization artifact if generated
    let gradCamKey = null;
    if (predictionResult.gradCamBase64) {
      try {
        gradCamKey = await imageStorageService.saveGradCamOverlay(
          predictionResult.gradCamBase64,
          originalImageKey
        );
      } catch (camErr) {
        logger.warn({ error: camErr.message }, 'Failed to persist Grad-CAM overlay image to disk');
      }
    }

    // 6. Persist authenticated assessment in MongoDB or purge transient files for guests
    let savedAssessmentId = null;
    let finalImageReference = originalImageKey;
    let finalGradCamReference = gradCamKey;

    if (user && user._id) {
      try {
        const assessmentDoc = await DiseaseAssessment.create({
          userId: user._id,
          farmId: validatedFarm ? validatedFarm._id : null,
          agriculturalRecordId: validatedRecordId,
          cropType,
          imageReference: originalImageKey,
          imageSha256: storedImage.sha256,
          predictionResult: {
            diseaseName: predictionResult.predictedDisease,
            diseaseNameDisplay: predictionResult.diseaseNameDisplay || predictionResult.predictedDisease,
            confidence: predictionResult.confidence,
            classProbabilities: predictionResult.classProbabilities || {},
            severity: predictionResult.severity,
            severityStatus: predictionResult.severityStatus || 'UNAVAILABLE',
            severityMethod: predictionResult.severityMethod,
            severityScore: predictionResult.severityScore,
            managementGuidance: predictionResult.managementGuidance || [],
            guidanceCitation: predictionResult.guidanceCitation,
            predictionStatus: predictionResult.predictionStatus || 'COMPLETED'
          },
          gradCamArtifactReference: gradCamKey,
          modelMetadata: {
            modelName: predictionResult.modelIdentifier || 'EfficientNet-B0',
            modelVersion: predictionResult.modelVersion || 'v1.0'
          },
          timestamp: new Date()
        });
        savedAssessmentId = assessmentDoc._id.toString();
      } catch (persistErr) {
        logger.error({ error: persistErr.message }, 'Failed to persist disease assessment record in MongoDB');
      }
    } else {
      // Guest User Privacy Policy: Eliminate unnecessary data retention by purging transient files
      try {
        await imageStorageService.deleteArtifact(originalImageKey, 'original');
        if (gradCamKey) {
          await imageStorageService.deleteArtifact(gradCamKey, 'gradcam');
        }
      } catch (cleanupErr) {
        logger.warn({ error: cleanupErr.message }, 'Failed to purge transient guest image artifacts');
      }
      finalImageReference = null;
      finalGradCamReference = null;
    }

    return {
      cropType,
      predictedDisease: predictionResult.predictedDisease,
      diseaseNameDisplay: predictionResult.diseaseNameDisplay || predictionResult.predictedDisease,
      confidence: predictionResult.confidence,
      classProbabilities: predictionResult.classProbabilities || {},
      severity: predictionResult.severity,
      severityStatus: predictionResult.severityStatus || 'UNAVAILABLE',
      severityMethod: predictionResult.severityMethod,
      severityScore: predictionResult.severityScore,
      imageReference: finalImageReference,
      gradCamArtifactReference: finalGradCamReference,
      guestPrivacyNotice: !user ? 'Ephemeral guest inference completed. Image artifacts were purged from disk to protect privacy.' : undefined,
      managementGuidance: predictionResult.managementGuidance || [],
      guidanceCitation: predictionResult.guidanceCitation,
      guidanceReviewedDate: predictionResult.guidanceReviewedDate,
      modelIdentifier: predictionResult.modelIdentifier || 'EfficientNet-B0',
      modelVersion: predictionResult.modelVersion || 'v1.0',
      predictionStatus: predictionResult.predictionStatus || 'COMPLETED',
      executionLatencyMs: predictionResult.executionLatencyMs,
      farmId: validatedFarm ? validatedFarm._id.toString() : null,
      savedAssessmentId,
      assessmentId: savedAssessmentId
    };
  }

  /**
   * Retrieve historical disease assessments for authenticated user
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
    if (query.severity) {
      filter['predictionResult.severity'] = query.severity;
    }
    if (query.disease) {
      filter['predictionResult.diseaseName'] = new RegExp(query.disease, 'i');
    }

    const [history, totalCount] = await Promise.all([
      DiseaseAssessment.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
      DiseaseAssessment.countDocuments(filter)
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
   * Retrieve specific authorized disease assessment by ID
   * @param {string|null} userId
   * @param {string} id
   */
  async getAssessmentById(userId, id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const assessment = await DiseaseAssessment.findById(id);
    if (!assessment) {
      return null;
    }

    if (userId && assessment.userId.toString() !== userId.toString()) {
      throw new ForbiddenError('You do not have permission to view this assessment');
    }

    return assessment;
  }
}

module.exports = new DiseaseDetectionService();

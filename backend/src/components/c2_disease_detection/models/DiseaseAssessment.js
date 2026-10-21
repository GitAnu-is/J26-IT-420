const mongoose = require('mongoose');
const { SUPPORTED_CROP_LIST } = require('../../../shared/constants/crops');

const diseaseAssessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    farmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      default: null,
      index: true
    },
    agriculturalRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AgriculturalRecord',
      default: null,
      index: true
    },
    cropType: {
      type: String,
      required: [true, 'Crop type is required'],
      enum: {
        values: SUPPORTED_CROP_LIST,
        message: `Crop must be one of: ${SUPPORTED_CROP_LIST.join(', ')}`
      },
      index: true
    },
    imageReference: {
      type: String,
      required: [true, 'Image reference (storage URL/key) is required']
      // Raw base64 data strings are intentionally forbidden from persistence
    },
    imageSha256: {
      type: String,
      default: null
    },
    predictionResult: {
      diseaseName: {
        type: String,
        required: [true, 'Disease name classification is required']
      },
      diseaseNameDisplay: {
        type: String,
        default: null
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1
      },
      classProbabilities: {
        type: Map,
        of: Number,
        default: {}
      },
      severity: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'HEALTHY', 'UNAVAILABLE', 'UNCERTAIN', 'Low', 'Medium', 'High', null],
        default: null
      },
      severityStatus: {
        type: String,
        enum: ['COMPLETED', 'UNAVAILABLE', 'NOT_APPLICABLE', null],
        default: 'UNAVAILABLE'
      },
      severityMethod: {
        type: String,
        default: null
      },
      severityScore: {
        type: Number,
        default: null
      },
      managementGuidance: {
        type: [String],
        default: []
      },
      guidanceCitation: {
        type: String,
        default: null
      },
      predictionStatus: {
        type: String,
        enum: ['COMPLETED', 'LOW_CONFIDENCE_FLAGGED', 'CROP_MISMATCH_SUSPECTED', null],
        default: 'COMPLETED'
      }
    },
    gradCamArtifactReference: {
      type: String,
      default: null
    },
    modelMetadata: {
      modelName: {
        type: String,
        default: 'EfficientNet-B0'
      },
      modelVersion: {
        type: String,
        default: 'v1.0'
      },
      datasetVersion: {
        type: String,
        default: 'v1.0'
      }
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

diseaseAssessmentSchema.index({ userId: 1, timestamp: -1 });
diseaseAssessmentSchema.index({ farmId: 1, timestamp: -1 });
diseaseAssessmentSchema.index({ cropType: 1, timestamp: -1 });

const DiseaseAssessment = mongoose.model('DiseaseAssessment', diseaseAssessmentSchema);

module.exports = DiseaseAssessment;

const mongoose = require('mongoose');
const { SUPPORTED_CROP_LIST } = require('../../../shared/constants/crops');

const transportationAssessmentSchema = new mongoose.Schema(
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
    cropType: {
      type: String,
      required: [true, 'Crop type is required'],
      enum: {
        values: SUPPORTED_CROP_LIST,
        message: `Crop must be one of: ${SUPPORTED_CROP_LIST.join(', ')}`
      },
      index: true
    },
    logisticsInputSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Logistics input snapshot is required']
    },
    predictionResult: {
      damageProbability: {
        type: Number,
        min: 0,
        max: 1,
        default: null
      },
      riskLevel: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'LOW', 'MEDIUM', 'HIGH', 'UNAVAILABLE', null],
        default: null
      },
      riskStatus: {
        type: String,
        enum: ['COMPLETED', 'UNAVAILABLE', 'OUT_OF_DISTRIBUTION'],
        default: 'COMPLETED'
      },
      recommendedPackaging: {
        type: String,
        default: null
      },
      storageGuidance: {
        type: [String],
        default: []
      },
      handlingGuidance: {
        type: [String],
        default: []
      },
      transportationGuidance: {
        type: [String],
        default: []
      },
      guidance: {
        type: [String],
        default: []
      },
      ruleId: {
        type: String,
        default: null
      },
      supportingReferences: {
        type: [String],
        default: []
      }
    },
    shapExplanationMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    modelMetadata: {
      modelName: {
        type: String,
        default: 'Gradient Boosting / XGBoost'
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

transportationAssessmentSchema.index({ userId: 1, timestamp: -1 });
transportationAssessmentSchema.index({ userId: 1, cropType: 1 });

const TransportationAssessment = mongoose.model('TransportationAssessment', transportationAssessmentSchema);

module.exports = TransportationAssessment;

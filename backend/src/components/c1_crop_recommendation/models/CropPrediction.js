const mongoose = require('mongoose');
const { SUPPORTED_CROP_LIST } = require('../../../shared/constants/crops');

const cropPredictionSchema = new mongoose.Schema(
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
    predictionType: {
      type: String,
      enum: {
        values: ['CROP_RECOMMENDATION', 'HARVEST_TIME'],
        message: 'Prediction type must be CROP_RECOMMENDATION or HARVEST_TIME'
      },
      required: [true, 'Prediction type is required'],
      index: true
    },
    cropType: {
      type: String,
      enum: {
        values: [...SUPPORTED_CROP_LIST, null],
        message: `Crop must be one of: ${SUPPORTED_CROP_LIST.join(', ')}`
      },
      default: null
    },
    inputSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Input snapshot is required for research reproducibility']
    },
    predictionResult: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Prediction result is required']
    },
    modelMetadata: {
      modelName: {
        type: String,
        default: 'Random Forest'
      },
      modelVersion: {
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

cropPredictionSchema.index({ userId: 1, timestamp: -1 });

const CropPrediction = mongoose.model('CropPrediction', cropPredictionSchema);

module.exports = CropPrediction;

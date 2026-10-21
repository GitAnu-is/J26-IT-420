const mongoose = require('mongoose');
const { SUPPORTED_CROP_LIST } = require('../constants/crops');

const agriculturalRecordSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
      index: true
    },
    farmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required: [true, 'Farm ID reference is required'],
      index: true
    },
    cropType: {
      type: String,
      required: [true, 'Crop type is required'],
      enum: {
        values: SUPPORTED_CROP_LIST,
        message: `Crop type must be one of: ${SUPPORTED_CROP_LIST.join(', ')}`
      },
      index: true
    },
    plantingDate: {
      type: Date,
      required: [true, 'Planting date is required']
    },
    expectedHarvestDate: {
      type: Date,
      default: null
    },
    actualHarvestDate: {
      type: Date,
      default: null
    },
    soilPh: {
      type: Number,
      min: [3.0, 'pH must be at least 3.0'],
      max: [10.0, 'pH must not exceed 10.0'],
      default: null
    },
    nitrogen: {
      type: Number,
      min: [0, 'Nitrogen must be non-negative'],
      default: null
    },
    phosphorus: {
      type: Number,
      min: [0, 'Phosphorus must be non-negative'],
      default: null
    },
    potassium: {
      type: Number,
      min: [0, 'Potassium must be non-negative'],
      default: null
    },
    soilMoisture: {
      type: Number,
      min: [0, 'Moisture percentage must be at least 0'],
      max: [100, 'Moisture percentage must not exceed 100'],
      default: null
    },
    locationContext: {
      type: String,
      trim: true,
      default: ''
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    },
    archivedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

agriculturalRecordSchema.index({ ownerId: 1, farmId: 1, isArchived: 1 });
agriculturalRecordSchema.index({ cropType: 1, plantingDate: -1 });

const AgriculturalRecord = mongoose.model('AgriculturalRecord', agriculturalRecordSchema);

module.exports = AgriculturalRecord;

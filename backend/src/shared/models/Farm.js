const mongoose = require('mongoose');
const { SUPPORTED_CROP_LIST } = require('../constants/crops');

const farmSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
      index: true
    },
    farmName: {
      type: String,
      required: [true, 'Farm name is required'],
      trim: true,
      minlength: [2, 'Farm name must be at least 2 characters long'],
      maxlength: [100, 'Farm name must not exceed 100 characters']
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
      index: true
    },
    agroEcologicalZone: {
      type: String,
      trim: true,
      default: ''
    },
    locationCoordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90'],
        default: null
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180'],
        default: null
      }
    },
    soilType: {
      type: String,
      trim: true,
      default: ''
    },
    area: {
      type: Number,
      min: [0, 'Farm area must be non-negative'],
      default: 0
    },
    areaUnit: {
      type: String,
      enum: {
        values: ['ACRES', 'HECTARES', 'PERCHES', 'SQUARE_METERS'],
        message: 'Area unit must be one of: ACRES, HECTARES, PERCHES, SQUARE_METERS'
      },
      default: 'ACRES'
    },
    supportedCrops: {
      type: [String],
      validate: {
        validator: function (crops) {
          if (!crops || !Array.isArray(crops)) return true;
          return crops.every((c) => SUPPORTED_CROP_LIST.includes(c));
        },
        message: `Supported crops must only contain values from: ${SUPPORTED_CROP_LIST.join(', ')}`
      },
      default: []
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

farmSchema.index({ ownerId: 1, isArchived: 1 });
farmSchema.index({ district: 1, isArchived: 1 });

const Farm = mongoose.model('Farm', farmSchema);

module.exports = Farm;

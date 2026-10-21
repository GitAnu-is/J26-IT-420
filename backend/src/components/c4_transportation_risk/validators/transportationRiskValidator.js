const { z } = require('zod');
const { SUPPORTED_CROP_LIST, isValidCrop, normalizeCropName } = require('../../../shared/constants/crops');

/**
 * Validated Vehicle Types common in Sri Lankan agricultural logistics
 */
const VEHICLE_TYPES = ['OPEN_TRUCK', 'COVERED_TRUCK', 'REFRIGERATED_TRUCK', 'THREE_WHEELER', 'PICKUP', 'TRACTOR_TRAILER'];

/**
 * Validated Packaging Types for Banana, Pineapple, and Black Pepper
 */
const PACKAGING_TYPES = ['WOODEN_CRATES', 'PLASTIC_CRATES', 'CORRUGATED_BOXES', 'GUNNY_BAGS', 'JUTE_BAGS', 'LOOSE_BULK', 'POLYETHYLENE_LINED_BAGS'];

/**
 * Validated Road Condition categories in Sri Lanka
 */
const ROAD_CONDITIONS = ['PAVED_GOOD', 'PAVED_POOR', 'UNPAVED_ROUGH', 'MIXED'];

/**
 * Zod schema for transportation risk prediction
 * Strictly independent: does not require quality grading or shelf-life prediction
 */
const predictTransportationRiskSchema = z.object({
  crop: z.string({ required_error: 'Crop is required' })
    .refine(isValidCrop, {
      message: `Crop must be one of: ${SUPPORTED_CROP_LIST.join(', ')}`
    })
    .transform(normalizeCropName),
  farmId: z.string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid farm ID format')
    .optional()
    .nullable(),
  distanceKm: z.number({ required_error: 'Distance is required' })
    .positive('Distance must be a positive number'),
  durationHours: z.number({ required_error: 'Duration is required' })
    .positive('Duration must be a positive number'),
  vehicleType: z.enum(VEHICLE_TYPES, {
    errorMap: () => ({ message: `Vehicle type must be one of: ${VEHICLE_TYPES.join(', ')}` })
  }),
  packagingType: z.enum(PACKAGING_TYPES, {
    errorMap: () => ({ message: `Packaging type must be one of: ${PACKAGING_TYPES.join(', ')}` })
  }),
  roadCondition: z.enum(ROAD_CONDITIONS, {
    errorMap: () => ({ message: `Road condition must be one of: ${ROAD_CONDITIONS.join(', ')}` })
  }),
  temperatureCelsius: z.number().min(-5, 'Temperature cannot be below -5°C').max(55, 'Temperature cannot exceed 55°C').optional().nullable(),
  humidityPercentage: z.number().min(0, 'Humidity cannot be below 0%').max(100, 'Humidity cannot exceed 100%').optional().nullable(),
  originDistrict: z.string().min(2, 'Origin district must be at least 2 characters').optional().nullable(),
  destinationDistrict: z.string().min(2, 'Destination district must be at least 2 characters').optional().nullable()
});

/**
 * Zod schema for smart packaging recommendation request
 */
const recommendPackagingSchema = z.object({
  crop: z.string({ required_error: 'Crop is required' })
    .refine(isValidCrop, {
      message: `Crop must be one of: ${SUPPORTED_CROP_LIST.join(', ')}`
    })
    .transform(normalizeCropName),
  distanceKm: z.number({ required_error: 'Distance is required' })
    .positive('Distance must be a positive number'),
  vehicleType: z.enum(VEHICLE_TYPES).optional().nullable(),
  expectedDurationHours: z.number().positive('Expected duration must be a positive number').optional().nullable(),
  currentPackagingType: z.enum(PACKAGING_TYPES).optional().nullable(),
  temperatureCelsius: z.number().min(-5).max(55).optional().nullable(),
  humidityPercentage: z.number().min(0).max(100).optional().nullable()
});

/**
 * Zod schema for transportation assessment ID parameter
 */
const assessmentIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid assessment ID format')
});

module.exports = {
  predictTransportationRiskSchema,
  recommendPackagingSchema,
  assessmentIdSchema,
  VEHICLE_TYPES,
  PACKAGING_TYPES,
  ROAD_CONDITIONS
};

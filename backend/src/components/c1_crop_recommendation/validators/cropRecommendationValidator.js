const { z } = require('zod');
const { SUPPORTED_CROP_LIST, isValidCrop, normalizeCropName } = require('../../../shared/constants/crops');

/**
 * Zod validation schema for crop recommendation input
 * Accepts soil chemistry and environmental attributes
 */
const recommendCropSchema = z.object({
  farmId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'farmId must be a valid 24-character MongoDB ObjectId').optional(),
  nitrogen: z.number().min(0, 'Nitrogen (N) must be non-negative').max(300, 'Nitrogen exceeds realistic upper limit'),
  phosphorus: z.number().min(0, 'Phosphorus (P) must be non-negative').max(300, 'Phosphorus exceeds realistic upper limit'),
  potassium: z.number().min(0, 'Potassium (K) must be non-negative').max(500, 'Potassium exceeds realistic upper limit'),
  ph: z.number().min(3.0, 'pH must be at least 3.0').max(10.0, 'pH must not exceed 10.0'),
  moisture: z.number().min(0, 'Soil moisture must be at least 0%').max(100, 'Soil moisture must not exceed 100%').optional(),
  temperature: z.number().min(10, 'Temperature below realistic range').max(50, 'Temperature above realistic range').optional(),
  humidity: z.number().min(0).max(100).optional(),
  rainfall: z.number().min(0).optional(),
  district: z.string().min(2, 'District name is required').optional(),
  agroEcologicalZone: z.string().optional(),
  season: z.enum(['YALA', 'MAHA']).optional(),
  latitude: z.number().min(5.5).max(10.0).optional(), // Sri Lanka latitude bounding box
  longitude: z.number().min(79.5).max(82.0).optional() // Sri Lanka longitude bounding box
});

/**
 * Zod validation schema for harvest planning / harvest window prediction
 */
const predictHarvestSchema = z.object({
  farmId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'farmId must be a valid 24-character MongoDB ObjectId').optional(),
  crop: z.string().refine(isValidCrop, {
    message: `Crop must be one of: ${SUPPORTED_CROP_LIST.join(', ')}`
  }).transform(normalizeCropName),
  plantingDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD')),
  variety: z.string().min(2).max(50).optional(),
  district: z.string().min(2).optional(),
  season: z.enum(['YALA', 'MAHA']).optional(),
  soilMoisture: z.number().min(0).max(100).optional(),
  ph: z.number().min(3.0).max(10.0).optional(),
  temperature: z.number().min(10).max(50).optional(),
  rainfall: z.number().min(0).optional()
});

module.exports = {
  recommendCropSchema,
  predictHarvestSchema
};

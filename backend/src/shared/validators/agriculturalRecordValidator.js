const { z } = require('zod');
const { SUPPORTED_CROP_LIST } = require('../constants/crops');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const recordIdParamSchema = z.object({
  id: z.string().regex(objectIdPattern, 'Invalid Record ID format. Must be a 24-character hexadecimal ObjectId')
});

const createRecordSchema = z
  .object({
    farmId: z.string().regex(objectIdPattern, 'Invalid Farm ID format. Must be a 24-character hexadecimal ObjectId'),
    cropType: z.enum(SUPPORTED_CROP_LIST, {
      errorMap: () => ({ message: `Crop type must be one of: ${SUPPORTED_CROP_LIST.join(', ')}` })
    }),
    plantingDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD or ISO format')),
    expectedHarvestDate: z
      .string()
      .datetime()
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD or ISO format'))
      .optional(),
    actualHarvestDate: z
      .string()
      .datetime()
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD or ISO format'))
      .optional(),
    soilPh: z.number().min(3.0, 'Soil pH must be at least 3.0').max(10.0, 'Soil pH must not exceed 10.0').optional(),
    nitrogen: z.number().min(0, 'Nitrogen must be non-negative').optional(),
    phosphorus: z.number().min(0, 'Phosphorus must be non-negative').optional(),
    potassium: z.number().min(0, 'Potassium must be non-negative').optional(),
    soilMoisture: z.number().min(0, 'Soil moisture must be at least 0%').max(100, 'Soil moisture must not exceed 100%').optional(),
    locationContext: z.string().trim().max(255).optional().default(''),
    notes: z.string().trim().max(1000).optional().default('')
  })
  .refine(
    (data) => {
      if (!data.expectedHarvestDate || !data.plantingDate) return true;
      return new Date(data.expectedHarvestDate) >= new Date(data.plantingDate);
    },
    {
      message: 'Expected harvest date cannot be earlier than planting date',
      path: ['expectedHarvestDate']
    }
  );

const updateRecordSchema = z.object({
  cropType: z.enum(SUPPORTED_CROP_LIST).optional(),
  plantingDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  expectedHarvestDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  actualHarvestDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  soilPh: z.number().min(3.0).max(10.0).optional(),
  nitrogen: z.number().min(0).optional(),
  phosphorus: z.number().min(0).optional(),
  potassium: z.number().min(0).optional(),
  soilMoisture: z.number().min(0).max(100).optional(),
  locationContext: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(1000).optional()
});

module.exports = {
  createRecordSchema,
  updateRecordSchema,
  recordIdParamSchema
};

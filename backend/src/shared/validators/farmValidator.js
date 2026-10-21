const { z } = require('zod');
const { SUPPORTED_CROP_LIST } = require('../constants/crops');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const farmIdParamSchema = z.object({
  id: z.string().regex(objectIdPattern, 'Invalid Farm ID format. Must be a 24-character hexadecimal ObjectId')
});

const createFarmSchema = z.object({
  farmName: z.string().trim().min(2, 'Farm name must be at least 2 characters long').max(100),
  district: z.string().trim().min(2, 'District must be at least 2 characters long').max(100),
  agroEcologicalZone: z.string().trim().max(100).optional().default(''),
  locationCoordinates: z
    .object({
      latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
      longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180')
    })
    .optional(),
  soilType: z.string().trim().max(100).optional().default(''),
  area: z.number().min(0, 'Area must be non-negative').optional().default(0),
  areaUnit: z.enum(['ACRES', 'HECTARES', 'PERCHES', 'SQUARE_METERS']).optional().default('ACRES'),
  supportedCrops: z
    .array(z.enum(SUPPORTED_CROP_LIST, {
      errorMap: () => ({ message: `Supported crops must only be from: ${SUPPORTED_CROP_LIST.join(', ')}` })
    }))
    .optional()
    .default([])
});

const updateFarmSchema = createFarmSchema.partial();

module.exports = {
  createFarmSchema,
  updateFarmSchema,
  farmIdParamSchema
};

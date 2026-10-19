const { z } = require('zod');
const { SUPPORTED_CROP_LIST, isValidCrop, normalizeCropName } = require('../../../shared/constants/crops');

/**
 * Zod schema for disease analysis request body
 * Supports manual crop selection (crop or cropType) and optional farmId
 */
const analyzeDiseaseSchema = z
  .object({
    crop: z
      .string()
      .optional()
      .refine((val) => !val || isValidCrop(val), {
        message: `Crop must be one of: ${SUPPORTED_CROP_LIST.join(', ')}`
      }),
    cropType: z
      .string()
      .optional()
      .refine((val) => !val || isValidCrop(val), {
        message: `Crop must be one of: ${SUPPORTED_CROP_LIST.join(', ')}`
      }),
    farmId: z.string().optional(),
    agriculturalRecordId: z.string().optional(),
    imageBase64: z.string().min(10, 'Valid base64 image data is required').optional(),
    imageUrl: z.string().url('Invalid image URL format').optional(),
    deviceMetadata: z
      .object({
        platform: z.enum(['web', 'android', 'ios']).optional(),
        appVersion: z.string().optional()
      })
      .optional()
  })
  .refine((data) => data.crop || data.cropType, {
    message: `Either 'crop' or 'cropType' must be specified from: ${SUPPORTED_CROP_LIST.join(', ')}`,
    path: ['crop']
  })
  .transform((data) => {
    const rawCrop = data.crop || data.cropType;
    const normalized = normalizeCropName(rawCrop);
    return {
      ...data,
      crop: normalized,
      cropType: normalized
    };
  });

/**
 * Schema for query params or path params
 */
const assessmentIdSchema = z.object({
  id: z.string().min(1, 'Assessment ID is required')
});

module.exports = {
  analyzeDiseaseSchema,
  assessmentIdSchema
};

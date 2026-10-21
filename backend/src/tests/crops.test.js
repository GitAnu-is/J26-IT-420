const {
  SUPPORTED_CROPS,
  SUPPORTED_CROP_LIST,
  CROP_METADATA,
  isValidCrop,
  normalizeCropName
} = require('../shared/constants/crops');

describe('Shared Crop Constants & Validation', () => {
  it('1. Confirms exactly three research crops are supported', () => {
    expect(SUPPORTED_CROP_LIST).toHaveLength(3);
    expect(SUPPORTED_CROP_LIST).toEqual(['BANANA', 'PINEAPPLE', 'BLACK_PEPPER']);
  });

  it('2. Validates the three supported crops directly and with normalizeCropName', () => {
    expect(isValidCrop('BANANA')).toBe(true);
    expect(isValidCrop('PINEAPPLE')).toBe(true);
    expect(isValidCrop('BLACK_PEPPER')).toBe(true);

    // Mixed case and spaces/hyphens
    expect(normalizeCropName('banana')).toBe('BANANA');
    expect(normalizeCropName('Pineapple')).toBe('PINEAPPLE');
    expect(normalizeCropName('black pepper')).toBe('BLACK_PEPPER');
    expect(normalizeCropName('black-pepper')).toBe('BLACK_PEPPER');
    expect(normalizeCropName(' BLACK_PEPPER ')).toBe('BLACK_PEPPER');
  });

  it('3. Rejects unsupported crops', () => {
    expect(isValidCrop('MANGO')).toBe(false);
    expect(isValidCrop('APPLE')).toBe(false);
    expect(isValidCrop('TOMATO')).toBe(false);
    expect(isValidCrop('PADDY')).toBe(false);
    expect(isValidCrop(null)).toBe(false);
    expect(isValidCrop(undefined)).toBe(false);
    expect(isValidCrop(123)).toBe(false);

    expect(normalizeCropName('mango')).toBeNull();
  });

  it('4. Provides accurate metadata and agro-ecological parameters for Sri Lanka', () => {
    const banana = CROP_METADATA[SUPPORTED_CROPS.BANANA];
    expect(banana.scientificName).toBe('Musa acuminata');
    expect(banana.optimalPhMin).toBeLessThanOrEqual(banana.optimalPhMax);

    const pineapple = CROP_METADATA[SUPPORTED_CROPS.PINEAPPLE];
    expect(pineapple.scientificName).toBe('Ananas comosus');

    const blackPepper = CROP_METADATA[SUPPORTED_CROPS.BLACK_PEPPER];
    expect(blackPepper.scientificName).toBe('Piper nigrum');
  });
});

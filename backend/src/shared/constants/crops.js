/**
 * Supported Agricultural Crops for Research Project J26-IT-420
 * All three research components (C1, C2, C4) standardize on these crops.
 */
const SUPPORTED_CROPS = Object.freeze({
  BANANA: 'BANANA',
  PINEAPPLE: 'PINEAPPLE',
  BLACK_PEPPER: 'BLACK_PEPPER'
});

const SUPPORTED_CROP_LIST = Object.freeze(Object.values(SUPPORTED_CROPS));

/**
 * Standardized Crop Metadata for Sri Lankan Agro-Ecological Context
 */
const CROP_METADATA = Object.freeze({
  [SUPPORTED_CROPS.BANANA]: {
    id: 'BANANA',
    commonName: 'Banana',
    scientificName: 'Musa acuminata',
    sinhalaName: 'කෙසෙල් (Kesel)',
    tamilName: 'வாழைப்பழம் (Vazhaippazham)',
    majorDistricts: ['Kurunegala', 'Gampaha', 'Kandy', 'Ratnapura', 'Embilipitiya', 'Hambantota'],
    agroEcologicalZones: ['Wet Zone Low Country', 'Intermediate Zone Low Country'],
    typicalHarvestDaysMin: 270,
    typicalHarvestDaysMax: 360,
    optimalPhMin: 5.5,
    optimalPhMax: 7.0
  },
  [SUPPORTED_CROPS.PINEAPPLE]: {
    id: 'PINEAPPLE',
    commonName: 'Pineapple',
    scientificName: 'Ananas comosus',
    sinhalaName: 'අන්නාසි (Annasi)',
    tamilName: 'அன்னாசி (Annasi)',
    majorDistricts: ['Gampaha', 'Kurunegala', 'Kalutara', 'Colombo'],
    agroEcologicalZones: ['Wet Zone Low Country (WL3, WL2)', 'Intermediate Zone Low Country (IL1)'],
    typicalHarvestDaysMin: 450,
    typicalHarvestDaysMax: 540,
    optimalPhMin: 4.5,
    optimalPhMax: 6.0
  },
  [SUPPORTED_CROPS.BLACK_PEPPER]: {
    id: 'BLACK_PEPPER',
    commonName: 'Black Pepper',
    scientificName: 'Piper nigrum',
    sinhalaName: 'ගම්මිරිස් (Gammiris)',
    tamilName: 'மிளகு (Milagu)',
    majorDistricts: ['Matale', 'Kandy', 'Kegalle', 'Kurunegala', 'Nuwara Eliya'],
    agroEcologicalZones: ['Wet Zone Mid Country', 'Intermediate Zone Mid Country'],
    typicalHarvestDaysMin: 240,
    typicalHarvestDaysMax: 300,
    optimalPhMin: 5.5,
    optimalPhMax: 6.5
  }
});

/**
 * Normalize input crop string to standard uppercase enum value
 * Handles spaces, hyphens, and mixed casing (e.g., 'black pepper' -> 'BLACK_PEPPER')
 * @param {string} input
 * @returns {string|null}
 */
function normalizeCropName(input) {
  if (typeof input !== 'string') return null;
  const cleaned = input.trim().toUpperCase().replace(/[\s-]+/g, '_');
  return SUPPORTED_CROP_LIST.includes(cleaned) ? cleaned : null;
}

/**
 * Check whether a crop identifier is supported by the research platform
 * @param {string} crop
 * @returns {boolean}
 */
function isValidCrop(crop) {
  return normalizeCropName(crop) !== null;
}

module.exports = {
  SUPPORTED_CROPS,
  SUPPORTED_CROP_LIST,
  CROP_METADATA,
  normalizeCropName,
  isValidCrop
};

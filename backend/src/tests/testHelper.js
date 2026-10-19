const mongoose = require('mongoose');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const User = require('../shared/models/User');
const RefreshSession = require('../shared/models/RefreshSession');
const Farm = require('../shared/models/Farm');
const AgriculturalRecord = require('../shared/models/AgriculturalRecord');
const CropPrediction = require('../components/c1_crop_recommendation/models/CropPrediction');
const DiseaseAssessment = require('../components/c2_disease_detection/models/DiseaseAssessment');
const TransportationAssessment = require('../components/c4_transportation_risk/models/TransportationAssessment');
const tokenService = require('../shared/services/tokenService');
const { ROLES } = require('../shared/constants/roles');

/**
 * Connect to test database before running suite
 */
async function setupTestDb() {
  if (mongoose.connection.readyState === 0) {
    await connectDatabase();
  }
}

/**
 * Clean up test records
 */
async function clearTestDb() {
  if (mongoose.connection.readyState === 1) {
    await Promise.all([
      User.deleteMany({ email: /@test\.sliit\.lk$/ }),
      RefreshSession.deleteMany({}),
      Farm.deleteMany({ farmName: /^Test Farm/ }),
      AgriculturalRecord.deleteMany({ locationContext: /^Test Location/ }),
      CropPrediction.deleteMany({}),
      DiseaseAssessment.deleteMany({}),
      TransportationAssessment.deleteMany({})
    ]);
  }
}

/**
 * Teardown test database connection
 */
async function teardownTestDb() {
  await clearTestDb();
  await disconnectDatabase();
}

/**
 * Create a test user in the database and return tokens
 * @param {object} options
 * @returns {Promise<{ user: object, accessToken: string, refreshToken: string, rawPassword: string }>}
 */
async function createTestUser({
  fullName = 'Test Farmer',
  email = `farmer_${Date.now()}_${Math.random().toString(36).substring(7)}@test.sliit.lk`,
  password = 'Password123!',
  role = ROLES.FARMER
} = {}) {
  await setupTestDb();

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    passwordHash,
    role
  });

  const accessToken = tokenService.generateAccessToken(user);
  const { refreshToken } = await tokenService.createRefreshSession(user);

  return {
    user,
    accessToken,
    refreshToken,
    rawPassword: password
  };
}

module.exports = {
  setupTestDb,
  clearTestDb,
  teardownTestDb,
  createTestUser
};

const request = require('supertest');
const app = require('../app');
const adapter = require('../components/c1_crop_recommendation/adapters/c1PythonInferenceAdapter');
const weatherService = require('../components/c1_crop_recommendation/services/weatherService');
const CropPrediction = require('../components/c1_crop_recommendation/models/CropPrediction');
const Farm = require('../shared/models/Farm');
const { setupTestDb, clearTestDb, teardownTestDb, createTestUser } = require('./testHelper');
const { ROLES } = require('../shared/constants/roles');

describe('Component 1: Crop Recommendation & Harvest Planning Endpoints', () => {
  let farmerA;
  let farmerB;
  let farmA;

  beforeAll(async () => {
    await setupTestDb();
    await clearTestDb();

    farmerA = await createTestUser({ fullName: 'Farmer C1 A', role: ROLES.FARMER });
    farmerB = await createTestUser({ fullName: 'Farmer C1 B', role: ROLES.FARMER });

    farmA = await Farm.create({
      ownerId: farmerA.user._id,
      farmName: 'Test Farm Alpha',
      district: 'Gampaha',
      agroEcologicalZone: 'WL2a',
      location: { latitude: 7.08, longitude: 79.99 },
      supportedCrops: ['BANANA', 'PINEAPPLE']
    });
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ===========================================================================
  // Crop Recommendation (POST /api/v1/crops/recommend)
  // ===========================================================================
  describe('Crop Recommendation (POST /api/v1/crops/recommend)', () => {
    it('1. Generates successful crop recommendation with mocked ML inference', async () => {
      jest.spyOn(adapter, 'requestCropRecommendation').mockResolvedValueOnce({
        recommendedCrop: 'BANANA',
        confidence: 0.945,
        classProbabilities: { BANANA: 0.945, PINEAPPLE: 0.035, BLACK_PEPPER: 0.02 },
        modelIdentifier: 'c1_crop_random_forest',
        modelVersion: 'v1.0',
        predictionTimestamp: new Date().toISOString()
      });

      const res = await request(app)
        .post('/api/v1/crops/recommend')
        .send({
          nitrogen: 180,
          phosphorus: 50,
          potassium: 320,
          ph: 6.3,
          moisture: 75,
          district: 'Gampaha'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendedCrop).toBe('BANANA');
      expect(res.body.data.confidence).toBe(0.945);
      expect(res.body.data.classProbabilities).toHaveProperty('BANANA');
      expect(res.body.data.modelIdentifier).toBe('c1_crop_random_forest');
      expect(res.body.data.modelVersion).toBe('v1.0');
    });

    it('2. Rejects invalid soil pH (< 3.0 or > 10.0) with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/v1/crops/recommend')
        .send({
          nitrogen: 100,
          phosphorus: 40,
          potassium: 200,
          ph: 2.4 // Below biological minimum
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('3. Rejects negative or excessive NPK values with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .post('/api/v1/crops/recommend')
        .send({
          nitrogen: -10, // Invalid negative
          phosphorus: 50,
          potassium: 200,
          ph: 6.0
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('4. Rejects missing required soil features (NPK, pH) with 400', async () => {
      const res = await request(app)
        .post('/api/v1/crops/recommend')
        .send({
          nitrogen: 120
          // missing phosphorus, potassium, ph
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('5. Rejects invalid farmId format with 400', async () => {
      const res = await request(app)
        .post('/api/v1/crops/recommend')
        .send({
          farmId: 'invalid-id-format',
          nitrogen: 120,
          phosphorus: 40,
          potassium: 200,
          ph: 6.2
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('6. CROSS-USER ISOLATION: Rejects using another farmer farmId with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/crops/recommend')
        .set('Authorization', `Bearer ${farmerB.accessToken}`)
        .send({
          farmId: farmA._id.toString(), // Farmer A's farm used by Farmer B
          nitrogen: 120,
          phosphorus: 40,
          potassium: 200,
          ph: 6.2
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('permission');
    });

    it('7. Gracefully continues recommendation when Weather API fails or times out', async () => {
      jest.spyOn(weatherService, 'getWeatherForLocation').mockResolvedValueOnce(null);
      jest.spyOn(adapter, 'requestCropRecommendation').mockResolvedValueOnce({
        recommendedCrop: 'PINEAPPLE',
        confidence: 0.88,
        classProbabilities: { BANANA: 0.08, PINEAPPLE: 0.88, BLACK_PEPPER: 0.04 },
        modelIdentifier: 'c1_crop_random_forest',
        modelVersion: 'v1.0'
      });

      const res = await request(app)
        .post('/api/v1/crops/recommend')
        .send({
          nitrogen: 90,
          phosphorus: 30,
          potassium: 160,
          ph: 5.0,
          district: 'Gampaha'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendedCrop).toBe('PINEAPPLE');
      expect(res.body.data.weatherProvenance).toBeNull();
    });

    it('8. Returns explicit 501 when Python inference adapter service is unreachable', async () => {
      // Real adapter without running service throws NotImplementedError / ServiceUnavailable
      const res = await request(app)
        .post('/api/v1/crops/recommend')
        .send({
          nitrogen: 150,
          phosphorus: 50,
          potassium: 300,
          ph: 6.2
        });

      expect([501, 503]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('9. Rejects malformed model response missing recommendedCrop with validation error', async () => {
      jest.spyOn(adapter, 'requestCropRecommendation').mockRejectedValueOnce(
        new (require('../shared/errors/AppError').ValidationError)('Malformed prediction response from machine learning service', [])
      );

      const res = await request(app)
        .post('/api/v1/crops/recommend')
        .send({
          nitrogen: 150,
          phosphorus: 50,
          potassium: 300,
          ph: 6.2
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('10. Automatically persists prediction in MongoDB for authenticated farmer', async () => {
      jest.spyOn(adapter, 'requestCropRecommendation').mockResolvedValueOnce({
        recommendedCrop: 'BANANA',
        confidence: 0.96,
        classProbabilities: { BANANA: 0.96, PINEAPPLE: 0.02, BLACK_PEPPER: 0.02 },
        modelIdentifier: 'c1_crop_random_forest',
        modelVersion: 'v1.0'
      });

      const res = await request(app)
        .post('/api/v1/crops/recommend')
        .set('Authorization', `Bearer ${farmerA.accessToken}`)
        .send({
          farmId: farmA._id.toString(),
          nitrogen: 180,
          phosphorus: 55,
          potassium: 330,
          ph: 6.3
        });

      expect(res.status).toBe(200);
      expect(res.body.data.savedPredictionId).toBeDefined();

      const savedDoc = await CropPrediction.findById(res.body.data.savedPredictionId);
      expect(savedDoc).toBeDefined();
      expect(savedDoc.userId.toString()).toBe(farmerA.user._id.toString());
      expect(savedDoc.cropType).toBe('BANANA');
      expect(savedDoc.predictionType).toBe('CROP_RECOMMENDATION');
      expect(savedDoc.modelMetadata.modelVersion).toBe('v1.0');
    });

    it('11. Unauthenticated guest user can generate recommendations without MongoDB persistence', async () => {
      jest.spyOn(adapter, 'requestCropRecommendation').mockResolvedValueOnce({
        recommendedCrop: 'BLACK_PEPPER',
        confidence: 0.91,
        classProbabilities: { BANANA: 0.03, PINEAPPLE: 0.06, BLACK_PEPPER: 0.91 },
        modelIdentifier: 'c1_crop_random_forest',
        modelVersion: 'v1.0'
      });

      const res = await request(app)
        .post('/api/v1/crops/recommend')
        .send({
          nitrogen: 130,
          phosphorus: 45,
          potassium: 170,
          ph: 6.0,
          district: 'Matale'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.savedPredictionId).toBeNull();
    });
  });

  // ===========================================================================
  // Harvest Time Prediction (POST /api/v1/crops/predict-harvest)
  // ===========================================================================
  describe('Harvest Prediction (POST /api/v1/crops/predict-harvest)', () => {
    it('12. Generates successful harvest prediction with duration and window', async () => {
      jest.spyOn(adapter, 'requestHarvestPrediction').mockResolvedValueOnce({
        cropType: 'BANANA',
        predictedDurationDays: 310,
        predictedHarvestDate: '2027-03-07',
        harvestWindow: { startDate: '2027-02-23', endDate: '2027-03-19' },
        confidenceMarginDays: 12,
        modelIdentifier: 'c1_harvest_random_forest',
        modelVersion: 'v1.0'
      });

      const res = await request(app)
        .post('/api/v1/crops/predict-harvest')
        .send({
          crop: 'BANANA',
          plantingDate: '2026-05-01',
          variety: 'Ambul',
          district: 'Gampaha'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.cropType).toBe('BANANA');
      expect(res.body.data.predictedDurationDays).toBe(310);
      expect(res.body.data.predictedHarvestDate).toBe('2027-03-07');
      expect(res.body.data.harvestWindow.startDate).toBe('2027-02-23');
    });

    it('13. Rejects unsupported crop (e.g. WATERMELON) with 400', async () => {
      const res = await request(app)
        .post('/api/v1/crops/predict-harvest')
        .send({
          crop: 'WATERMELON',
          plantingDate: '2026-05-01'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('14. Persists harvest prediction in MongoDB for authenticated farmer', async () => {
      jest.spyOn(adapter, 'requestHarvestPrediction').mockResolvedValueOnce({
        cropType: 'PINEAPPLE',
        predictedDurationDays: 480,
        predictedHarvestDate: '2027-08-25',
        harvestWindow: { startDate: '2027-08-13', endDate: '2027-09-06' },
        confidenceMarginDays: 12,
        modelIdentifier: 'c1_harvest_random_forest',
        modelVersion: 'v1.0'
      });

      const res = await request(app)
        .post('/api/v1/crops/predict-harvest')
        .set('Authorization', `Bearer ${farmerA.accessToken}`)
        .send({
          farmId: farmA._id.toString(),
          crop: 'PINEAPPLE',
          plantingDate: '2026-05-01',
          variety: 'Mauritius'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.savedPredictionId).toBeDefined();

      const savedDoc = await CropPrediction.findById(res.body.data.savedPredictionId);
      expect(savedDoc).toBeDefined();
      expect(savedDoc.predictionType).toBe('HARVEST_TIME');
      expect(savedDoc.cropType).toBe('PINEAPPLE');
    });
  });

  // ===========================================================================
  // History Retrieval (GET /api/v1/crops/history)
  // ===========================================================================
  describe('Component 1 Prediction History (GET /api/v1/crops/history)', () => {
    it('15. Retrieves paginated prediction history for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/crops/history?page=1&limit=10')
        .set('Authorization', `Bearer ${farmerA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.history)).toBe(true);
      expect(res.body.data.history.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.pagination).toHaveProperty('totalRecords');
    });

    it('16. CROSS-USER ISOLATION: Farmer B history does not contain Farmer A predictions', async () => {
      const res = await request(app)
        .get('/api/v1/crops/history')
        .set('Authorization', `Bearer ${farmerB.accessToken}`);

      expect(res.status).toBe(200);
      // Farmer B has not saved any predictions
      expect(res.body.data.history.length).toBe(0);
      expect(res.body.data.pagination.totalRecords).toBe(0);
    });

    it('17. Allows filtering history by predictionType and cropType', async () => {
      const res = await request(app)
        .get('/api/v1/crops/history?predictionType=CROP_RECOMMENDATION&cropType=BANANA')
        .set('Authorization', `Bearer ${farmerA.accessToken}`);

      expect(res.status).toBe(200);
      res.body.data.history.forEach((rec) => {
        expect(rec.predictionType).toBe('CROP_RECOMMENDATION');
        expect(rec.cropType).toBe('BANANA');
      });
    });

    it('18. Unauthenticated request to /crops/history returns empty history safely', async () => {
      const res = await request(app).get('/api/v1/crops/history');
      expect(res.status).toBe(200);
      expect(res.body.data.history).toEqual([]);
    });
  });
});

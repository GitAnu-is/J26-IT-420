const request = require('supertest');
const app = require('../app');
const CropPrediction = require('../components/c1_crop_recommendation/models/CropPrediction');
const DiseaseAssessment = require('../components/c2_disease_detection/models/DiseaseAssessment');
const TransportationAssessment = require('../components/c4_transportation_risk/models/TransportationAssessment');
const { ROLES } = require('../shared/constants/roles');
const { setupTestDb, clearTestDb, teardownTestDb, createTestUser } = require('./testHelper');

describe('Phase 2 — Research Assessment Persistence & History APIs', () => {
  let farmerA;
  let farmerB;

  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    farmerA = await createTestUser({ fullName: 'Research Farmer A', role: ROLES.FARMER });
    farmerB = await createTestUser({ fullName: 'Research Farmer B', role: ROLES.FARMER });
  });

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('Component 1: Crop Recommendation History (/api/v1/crops/history)', () => {
    it('1. Returns empty list when no assessments exist (Never fabricated AI results)', async () => {
      const res = await request(app)
        .get('/api/v1/crops/history')
        .set('Authorization', `Bearer ${farmerA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.history).toEqual([]);
      expect(res.body.data.pagination.totalRecords).toBe(0);
    });

    it('2. Retrieves persisted crop prediction and isolates records across users', async () => {
      // Persist real CropPrediction for Farmer A
      await CropPrediction.create({
        userId: farmerA.user._id,
        predictionType: 'CROP_RECOMMENDATION',
        cropType: 'BANANA',
        inputSnapshot: { nitrogen: 80, phosphorus: 45, potassium: 60, ph: 6.2 },
        predictionResult: { recommendedCrop: 'BANANA', confidence: 0.92 },
        modelMetadata: { modelName: 'Random Forest Classifier', modelVersion: 'v1.0' }
      });

      // Farmer A queries history
      const resA = await request(app)
        .get('/api/v1/crops/history')
        .set('Authorization', `Bearer ${farmerA.accessToken}`);

      expect(resA.status).toBe(200);
      expect(resA.body.data.history.length).toBe(1);
      expect(resA.body.data.history[0].cropType).toBe('BANANA');
      expect(resA.body.data.history[0].modelMetadata.modelName).toBe('Random Forest Classifier');

      // Farmer B queries history -> must be completely empty!
      const resB = await request(app)
        .get('/api/v1/crops/history')
        .set('Authorization', `Bearer ${farmerB.accessToken}`);

      expect(resB.status).toBe(200);
      expect(resB.body.data.history).toEqual([]);
    });
  });

  describe('Component 2: Disease Assessment History & Details (/api/v1/diseases/history)', () => {
    it('1. Returns empty list when no disease assessments exist', async () => {
      const res = await request(app)
        .get('/api/v1/diseases/history')
        .set('Authorization', `Bearer ${farmerA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.history).toEqual([]);
    });

    it('2. Retrieves persisted disease assessment with Grad-CAM and isolates users', async () => {
      const assessment = await DiseaseAssessment.create({
        userId: farmerA.user._id,
        cropType: 'PINEAPPLE',
        imageReference: 'storage/pineapples/leaf_sample_01.jpg',
        predictionResult: {
          diseaseName: 'Heart Rot',
          confidence: 0.88,
          severity: 'Medium',
          managementGuidance: ['Improve drainage', 'Apply registered fungicide']
        },
        gradCamArtifactReference: 'storage/gradcam/sample_01_heatmap.png',
        modelMetadata: { modelName: 'EfficientNet-B0', modelVersion: 'v1.0' }
      });

      // Farmer A retrieves history
      const resA = await request(app)
        .get('/api/v1/diseases/history')
        .set('Authorization', `Bearer ${farmerA.accessToken}`);

      expect(resA.status).toBe(200);
      expect(resA.body.data.history.length).toBe(1);
      expect(resA.body.data.history[0].predictionResult.diseaseName).toBe('Heart Rot');

      // Farmer A gets assessment by ID
      const detailRes = await request(app)
        .get(`/api/v1/diseases/assessments/${assessment._id}`)
        .set('Authorization', `Bearer ${farmerA.accessToken}`);

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.assessment.imageReference).toBe('storage/pineapples/leaf_sample_01.jpg');

      // Farmer B tries to view Farmer A assessment -> 403 Forbidden
      const forbiddenRes = await request(app)
        .get(`/api/v1/diseases/assessments/${assessment._id}`)
        .set('Authorization', `Bearer ${farmerB.accessToken}`);

      expect(forbiddenRes.status).toBe(403);
      expect(forbiddenRes.body.error.code).toBe('FORBIDDEN');
    });

    it('3. GET /api/v1/diseases/assessments/:id returns 404 for non-existent assessment', async () => {
      const res = await request(app)
        .get('/api/v1/diseases/assessments/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${farmerA.accessToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Component 4: Transportation Assessment History (/api/v1/transportation/history)', () => {
    it('1. Retrieves persisted transportation risk records and isolates across users', async () => {
      await TransportationAssessment.create({
        userId: farmerA.user._id,
        cropType: 'BLACK_PEPPER',
        logisticsInputSnapshot: {
          distanceKm: 140,
          durationHours: 5,
          vehicleType: 'COVERED_TRUCK',
          packagingType: 'GUNNY_BAGS',
          roadCondition: 'PAVED_GOOD'
        },
        predictionResult: {
          damageProbability: 0.12,
          riskLevel: 'Low',
          recommendedPackaging: 'Double-lined jute bags with moisture barrier',
          guidance: ['Ensure vehicle ventilation']
        },
        shapExplanationMetadata: {
          topFactors: [{ feature: 'distanceKm', impact: '+0.05' }]
        },
        modelMetadata: { modelName: 'XGBoost', modelVersion: 'v1.0' }
      });

      const resA = await request(app)
        .get('/api/v1/transportation/history')
        .set('Authorization', `Bearer ${farmerA.accessToken}`);

      expect(resA.status).toBe(200);
      expect(resA.body.data.history.length).toBe(1);
      expect(resA.body.data.history[0].predictionResult.riskLevel).toBe('Low');

      // Farmer B history is empty
      const resB = await request(app)
        .get('/api/v1/transportation/history')
        .set('Authorization', `Bearer ${farmerB.accessToken}`);

      expect(resB.status).toBe(200);
      expect(resB.body.data.history).toEqual([]);
    });

    it('2. Preserves 501 Not Implemented adapter boundary without fabricating predictions', async () => {
      const res = await request(app)
        .post('/api/v1/transportation/predict-risk')
        .set('Authorization', `Bearer ${farmerA.accessToken}`)
        .send({
          crop: 'BANANA',
          distanceKm: 120,
          durationHours: 4,
          vehicleType: 'COVERED_TRUCK',
          packagingType: 'PLASTIC_CRATES',
          roadCondition: 'PAVED_GOOD'
        });

      expect(res.status).toBe(501);
      expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
      expect(res.body.message).toContain('Component 4');
    });
  });
});

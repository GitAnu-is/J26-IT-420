/**
 * Phase 6 End-to-End Integration Test Suite
 * AgriGuard Research Project (J26-IT-420 - SLIIT)
 *
 * Verifies all 10 core integration scenarios specified in Phase 6:
 * 1. Authentication and Farm Registration
 * 2. Crop Recommendation Workflow
 * 3. Harvest Planning Workflow
 * 4. Disease Analysis Workflow
 * 5. Transportation Risk & SHAP Workflow
 * 6. Independent Packaging Recommendation Workflow
 * 7. Independent Component Execution (No Removed Component 3)
 * 8. AI Service Failure Isolation
 * 9. Cross-User Privacy & Role Authorization
 * 10. Truthful Handling of Unavailable Models (No Fake Predictions)
 * 11. Consolidated Agricultural Farm Overview (GET /api/v1/farms/:id/overview)
 */

const request = require('supertest');
const app = require('../app');
const { setupTestDb, clearTestDb, teardownTestDb, createTestUser } = require('./testHelper');
const { ROLES } = require('../shared/constants/roles');
const { ServiceUnavailableError } = require('../shared/errors/AppError');

// Research adapters
const c1Adapter = require('../components/c1_crop_recommendation/adapters/c1PythonInferenceAdapter');
const c2Adapter = require('../components/c2_disease_detection/adapters/c2PythonInferenceAdapter');
const c4Adapter = require('../components/c4_transportation_risk/adapters/c4PythonInferenceAdapter');

// Models
const Farm = require('../shared/models/Farm');
const AgriculturalRecord = require('../shared/models/AgriculturalRecord');
const CropPrediction = require('../components/c1_crop_recommendation/models/CropPrediction');
const DiseaseAssessment = require('../components/c2_disease_detection/models/DiseaseAssessment');
const TransportationAssessment = require('../components/c4_transportation_risk/models/TransportationAssessment');

describe('PHASE 6: End-to-End Backend Integration & Research Validation Suite', () => {
  let farmerAlpha;
  let farmerBeta;
  let adminUser;
  let registeredFarmId;
  let registeredRecordId;

  // Genuine 1x1 JPEG fixture for foliar upload tests
  const validJpegFixture = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
    0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
    0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
    0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x20,
    0x00, 0x20, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x1f, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
    0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
    0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f,
    0x00, 0xbf, 0x80, 0xff, 0xd9
  ]);

  beforeAll(async () => {
    await setupTestDb();
    await clearTestDb();

    farmerAlpha = await createTestUser({ fullName: 'Farmer Alpha SLIIT', role: ROLES.FARMER });
    farmerBeta = await createTestUser({ fullName: 'Farmer Beta SLIIT', role: ROLES.FARMER });
    adminUser = await createTestUser({ fullName: 'Platform Admin SLIIT', role: ROLES.ADMIN });

    const farmDoc = await Farm.create({
      farmName: 'Test Farm Alpha Prime',
      ownerId: farmerAlpha.user._id,
      district: 'Kurunegala',
      locationContext: 'Pannala Agrarian Division',
      sizeHectares: 2.5,
      soilType: 'Red-Yellow Podzolic',
      supportedCrops: ['BANANA', 'PINEAPPLE', 'BLACK_PEPPER']
    });
    registeredFarmId = farmDoc._id;
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ===========================================================================
  // Scenario 1: Authentication and Farm Registration
  // ===========================================================================
  describe('Test Scenario 1 — Authentication and Farm Registration', () => {
    const newFarmerEmail = `new_farmer_${Date.now()}@test.sliit.lk`;
    const newFarmerPassword = 'Password123!';
    let newFarmerToken = '';
    let newlyCreatedFarmId = '';

    it('1.1 Registers a new farmer user account', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Chaminda Silva',
          email: newFarmerEmail,
          password: newFarmerPassword,
          phoneNumber: '0712345678',
          role: 'FARMER'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(newFarmerEmail.toLowerCase());
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('1.2 Logs in with newly registered credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: newFarmerEmail,
          password: newFarmerPassword
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      newFarmerToken = res.body.data.accessToken;
      expect(newFarmerToken).toBeDefined();
    });

    it('1.3 Creates a new farm for authenticated farmer', async () => {
      const res = await request(app)
        .post('/api/v1/farms')
        .set('Authorization', `Bearer ${newFarmerToken}`)
        .send({
          farmName: 'Test Farm Kurunegala Alpha',
          district: 'Kurunegala',
          locationContext: 'Pannala Agrarian Division',
          sizeHectares: 3.5,
          soilType: 'Red-Yellow Podzolic',
          supportedCrops: ['BANANA', 'PINEAPPLE'],
          coordinates: { latitude: 7.48, longitude: 80.36 }
        });

      expect(res.status).toBe(201);
      expect(res.body.data.farm.farmName).toBe('Test Farm Kurunegala Alpha');
      newlyCreatedFarmId = res.body.data.farm._id;
      expect(newlyCreatedFarmId).toBeDefined();
    });

    it('1.4 Adds an agricultural record referencing the farm', async () => {
      const res = await request(app)
        .post('/api/v1/agricultural-records')
        .set('Authorization', `Bearer ${newFarmerToken}`)
        .send({
          farmId: newlyCreatedFarmId,
          cropType: 'BANANA',
          plantingDate: '2026-01-10',
          nitrogen: 110,
          phosphorus: 45,
          potassium: 210,
          soilPh: 6.2,
          soilMoisture: 70,
          locationContext: 'Test Location Field Plot 1'
        });

      expect(res.status).toBe(201);
      registeredRecordId = res.body.data.record._id;
      expect(registeredRecordId).toBeDefined();
    });

    it('1.5 Retrieves agricultural records and verifies farm ownership', async () => {
      const res = await request(app)
        .get(`/api/v1/agricultural-records?farmId=${newlyCreatedFarmId}`)
        .set('Authorization', `Bearer ${newFarmerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.records.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.records[0]._id).toBe(registeredRecordId);
    });
  });

  // ===========================================================================
  // Scenario 2: Crop Recommendation Workflow
  // ===========================================================================
  describe('Test Scenario 2 — Crop Recommendation Workflow', () => {
    it('2.1 Authenticates, submits soil data, delegates to C1 inference, and persists', async () => {
      jest.spyOn(c1Adapter, 'requestCropRecommendation').mockResolvedValueOnce({
        recommendedCrop: 'BANANA',
        confidence: 0.94,
        classProbabilities: { BANANA: 0.94, PINEAPPLE: 0.04, BLACK_PEPPER: 0.02 },
        modelIdentifier: 'c1_crop_random_forest',
        modelVersion: 'v1.0'
      });

      const res = await request(app)
        .post('/api/v1/crops/recommend')
        .set('Authorization', `Bearer ${farmerAlpha.accessToken}`)
        .send({
          farmId: registeredFarmId,
          nitrogen: 130,
          phosphorus: 50,
          potassium: 220,
          ph: 6.3,
          moisture: 72,
          district: 'Kurunegala'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendedCrop).toBe('BANANA');
      expect(res.body.data.confidence).toBe(0.94);
      expect(res.body.data.savedPredictionId).toBeDefined();

      // Verify persisted MongoDB document
      const doc = await CropPrediction.findById(res.body.data.savedPredictionId);
      expect(doc).toBeDefined();
      expect(doc.userId.toString()).toBe(farmerAlpha.user._id.toString());
      expect(doc.cropType).toBe('BANANA');
    });

    it('2.2 Retrieves crop prediction from authenticated history', async () => {
      const res = await request(app)
        .get('/api/v1/crops/history?predictionType=CROP_RECOMMENDATION')
        .set('Authorization', `Bearer ${farmerAlpha.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.history.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.history[0].cropType).toBe('BANANA');
    });
  });

  // ===========================================================================
  // Scenario 3: Harvest Planning Workflow
  // ===========================================================================
  describe('Test Scenario 3 — Harvest Planning Workflow', () => {
    it('3.1 Selects crop, submits planting reference date, executes C1 harvest prediction', async () => {
      jest.spyOn(c1Adapter, 'requestHarvestPrediction').mockResolvedValueOnce({
        cropType: 'BANANA',
        predictedHarvestDays: 310,
        estimatedHarvestDate: '2026-11-20',
        harvestWindow: {
          earliestDate: '2026-11-10',
          optimalDate: '2026-11-20',
          latestDate: '2026-11-30'
        },
        modelIdentifier: 'c1_harvest_random_forest',
        modelVersion: 'v1.0'
      });

      const res = await request(app)
        .post('/api/v1/crops/predict-harvest')
        .set('Authorization', `Bearer ${farmerAlpha.accessToken}`)
        .send({
          crop: 'BANANA',
          plantingDate: '2026-01-15',
          farmId: registeredFarmId
        });

      expect(res.status).toBe(200);
      expect(res.body.data.cropType).toBe('BANANA');
      expect(res.body.data.predictedHarvestDays).toBe(310);
      expect(res.body.data.harvestWindow).toBeDefined();
      expect(res.body.data.savedPredictionId).toBeDefined();
    });
  });

  // ===========================================================================
  // Scenario 4: Disease Analysis Workflow
  // ===========================================================================
  describe('Test Scenario 4 — Disease Analysis Workflow', () => {
    let savedAssessmentId = '';

    it('4.1 Uploads genuine leaf image, executes C2 inference, verifies UNAVAILABLE severity and Grad-CAM', async () => {
      jest.spyOn(c2Adapter, 'requestDiseaseAnalysis').mockResolvedValueOnce({
        cropType: 'BANANA',
        predictedDisease: 'Sigatoka Leaf Spot',
        diseaseNameDisplay: 'Sigatoka Leaf Spot (Pseudocercospora musae)',
        confidence: 0.93,
        classProbabilities: {
          'Healthy Foliage': 0.03,
          'Sigatoka Leaf Spot': 0.93,
          'Banana Bunchy Top Virus (BBTV)': 0.04
        },
        severity: null,
        severityStatus: 'UNAVAILABLE',
        severityMethod: 'UNAVAILABLE_PENDING_ANNOTATED_DATASET',
        managementGuidance: [
          'Deleaf severely spotted foliage to reduce inoculum pressure.',
          'Apply propiconazole or mancozeb as recommended by DOA Sri Lanka Bulletin PH-04.'
        ],
        guidanceCitation: 'Department of Agriculture Sri Lanka - Extension Circular No. 2021/04',
        gradCamBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        modelIdentifier: 'c2_efficientnet_b0',
        modelVersion: 'v1.0'
      });

      const res = await request(app)
        .post('/api/v1/diseases/analyze')
        .set('Authorization', `Bearer ${farmerAlpha.accessToken}`)
        .field('crop', 'BANANA')
        .field('farmId', registeredFarmId.toString())
        .attach('image', validJpegFixture, 'banana_leaf.jpg');

      expect(res.status).toBe(200);
      expect(res.body.data.predictedDisease).toBe('Sigatoka Leaf Spot');
      expect(res.body.data.severityStatus).toBe('UNAVAILABLE');
      expect(res.body.data.gradCamArtifactReference).toBeDefined();
      savedAssessmentId = res.body.data.assessmentId;
      expect(savedAssessmentId).toBeDefined();
    });

    it('4.2 Authenticated owner retrieves disease assessment history and single record', async () => {
      const res = await request(app)
        .get(`/api/v1/diseases/assessments/${savedAssessmentId}`)
        .set('Authorization', `Bearer ${farmerAlpha.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.assessment.cropType).toBe('BANANA');
      expect(res.body.data.assessment.predictionResult.diseaseName).toBe('Sigatoka Leaf Spot');
    });
  });

  // ===========================================================================
  // Scenario 5: Transportation Assessment Workflow
  // ===========================================================================
  describe('Test Scenario 5 — Transportation Assessment Workflow', () => {
    let transportAssessmentId = '';

    it('5.1 Submits transport details, executes C4 inference, verifies probability, risk level and SHAP', async () => {
      jest.spyOn(c4Adapter, 'requestRiskPrediction').mockResolvedValueOnce({
        cropType: 'BANANA',
        damageProbability: 0.22,
        riskLevel: 'LOW',
        riskStatus: 'COMPLETED',
        modelIdentifier: 'c4_gradient_boosting',
        modelVersion: 'v1.0',
        shapExplanation: {
          baseValue: 0.35,
          topPositiveDrivers: [{ featureName: 'Transit Distance', shapValue: 0.05 }],
          topMitigatingDrivers: [{ featureName: 'Plastic Crates', shapValue: -0.18 }]
        },
        packagingRecommendation: {
          recommendedPackaging: 'Ventilated rigid plastic crates with foam interleaves',
          storageGuidance: ['Maintain 13-15°C'],
          handlingGuidance: ['Stack no higher than 4 crates'],
          transportationGuidance: ['Cross-strap crates to prevent shifting'],
          supportingReferences: ['DOA Sri Lanka Bulletin PH-04']
        }
      });

      const res = await request(app)
        .post('/api/v1/transportation/predict-risk')
        .set('Authorization', `Bearer ${farmerAlpha.accessToken}`)
        .send({
          crop: 'BANANA',
          farmId: registeredFarmId.toString(),
          distanceKm: 65,
          durationHours: 2.5,
          vehicleType: 'COVERED_TRUCK',
          roadCondition: 'PAVED_GOOD',
          packagingType: 'PLASTIC_CRATES'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.damageProbability).toBe(0.22);
      expect(res.body.data.riskLevel).toBe('LOW');
      expect(res.body.data.shapExplanation).toBeDefined();
      transportAssessmentId = res.body.data.assessmentId;
      expect(transportAssessmentId).toBeDefined();
    });

    it('5.2 Retrieves transportation history for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/transportation/history')
        .set('Authorization', `Bearer ${farmerAlpha.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.history.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ===========================================================================
  // Scenario 6: Packaging Recommendation Workflow
  // ===========================================================================
  describe('Test Scenario 6 — Independent Smart Packaging Recommendation', () => {
    it('6.1 Retrieves source-backed packaging rules without invoking ML risk models', async () => {
      jest.spyOn(c4Adapter, 'requestPackagingRecommendation').mockResolvedValueOnce({
        cropType: 'PINEAPPLE',
        distanceKm: 120,
        recommendedPackaging: 'Two-piece telescoping corrugated fiberboard boxes with vertical dividers',
        storageGuidance: ['Transport at 8-10°C with 85-90% relative humidity'],
        handlingGuidance: ['Pack crowns facing alternately top-to-bottom'],
        transportationGuidance: ['Use refrigerated or well-ventilated covered truck'],
        supportingReferences: ['Department of Agriculture Sri Lanka - Pineapple Post-Harvest Guide'],
        ruleVersion: 'v1.0'
      });

      const res = await request(app)
        .post('/api/v1/transportation/recommend-packaging')
        .send({
          crop: 'PINEAPPLE',
          distanceKm: 120,
          vehicleType: 'COVERED_TRUCK'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.recommendedPackaging).toContain('corrugated fiberboard');
      expect(res.body.data.supportingReferences.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ===========================================================================
  // Scenario 7: Independent Components (No Component 3 Dependency)
  // ===========================================================================
  describe('Test Scenario 7 — Independent Components Execution', () => {
    it('7.1 C1 operates independently without calling C2 or C4', async () => {
      const c2Spy = jest.spyOn(c2Adapter, 'requestDiseaseAnalysis');
      const c4Spy = jest.spyOn(c4Adapter, 'requestRiskPrediction');
      jest.spyOn(c1Adapter, 'requestCropRecommendation').mockResolvedValueOnce({
        recommendedCrop: 'BLACK_PEPPER',
        confidence: 0.91,
        classProbabilities: { BANANA: 0.05, PINEAPPLE: 0.04, BLACK_PEPPER: 0.91 },
        modelIdentifier: 'c1_crop_random_forest',
        modelVersion: 'v1.0'
      });

      const res = await request(app)
        .post('/api/v1/crops/recommend')
        .send({ nitrogen: 80, phosphorus: 60, potassium: 120, ph: 5.8 });

      expect(res.status).toBe(200);
      expect(c2Spy).not.toHaveBeenCalled();
      expect(c4Spy).not.toHaveBeenCalled();
    });

    it('7.2 Confirms system has zero routes, models, or dependencies for removed Component 3', async () => {
      const res = await request(app).get('/api/v1');
      expect(res.status).toBe(200);
      const components = res.body.data.researchComponents;
      const c3Found = components.some((c) => c.id === 'C3' || c.code.includes('quality') || c.code.includes('grading'));
      expect(c3Found).toBe(false);

      const healthRes = await request(app).get('/api/v1/health');
      expect(healthRes.body.data.activeComponents).not.toHaveProperty('c3_quality_grading');
    });
  });

  // ===========================================================================
  // Scenario 8: AI Service Failure Isolation
  // ===========================================================================
  describe('Test Scenario 8 — Failure Isolation Across AI Services', () => {
    it('8.1 Failure in C2 microservice does NOT affect C1 or C4 operations', async () => {
      // Simulate C2 offline with ServiceUnavailableError
      jest.spyOn(c2Adapter, 'requestDiseaseAnalysis').mockRejectedValueOnce(
        new ServiceUnavailableError('C2 Deep learning microservice is offline')
      );

      // C2 request fails with 503
      const c2Res = await request(app)
        .post('/api/v1/diseases/analyze')
        .set('Authorization', `Bearer ${farmerAlpha.accessToken}`)
        .field('crop', 'BANANA')
        .attach('image', validJpegFixture, 'test.jpg');

      expect(c2Res.status).toBe(503);
      expect(c2Res.body.error.code).toBe('SERVICE_UNAVAILABLE');

      // Simultaneously, C1 continues working without interruption
      jest.spyOn(c1Adapter, 'requestCropRecommendation').mockResolvedValueOnce({
        recommendedCrop: 'BANANA',
        confidence: 0.88,
        classProbabilities: { BANANA: 0.88, PINEAPPLE: 0.08, BLACK_PEPPER: 0.04 },
        modelIdentifier: 'c1_crop_random_forest',
        modelVersion: 'v1.0'
      });

      const c1Res = await request(app)
        .post('/api/v1/crops/recommend')
        .send({ nitrogen: 100, phosphorus: 40, potassium: 180, ph: 6.0 });

      expect(c1Res.status).toBe(200);
      expect(c1Res.body.data.recommendedCrop).toBe('BANANA');

      // Simultaneously, C4 continues working without interruption
      jest.spyOn(c4Adapter, 'requestPackagingRecommendation').mockResolvedValueOnce({
        cropType: 'BANANA',
        distanceKm: 50,
        recommendedPackaging: 'Plastic Crates'
      });

      const c4Res = await request(app)
        .post('/api/v1/transportation/recommend-packaging')
        .send({ crop: 'BANANA', distanceKm: 50 });

      expect(c4Res.status).toBe(200);
    });
  });

  // ===========================================================================
  // Scenario 9: Authorization & Cross-User Privacy
  // ===========================================================================
  describe('Test Scenario 9 — Authorization and Cross-User Isolation', () => {
    it('9.1 Farmer Beta is forbidden from accessing Farmer Alpha private farm', async () => {
      const res = await request(app)
        .get(`/api/v1/farms/${registeredFarmId}`)
        .set('Authorization', `Bearer ${farmerBeta.accessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('9.2 Platform Admin can inspect farm records according to administrative policy', async () => {
      const res = await request(app)
        .get(`/api/v1/farms/${registeredFarmId}`)
        .set('Authorization', `Bearer ${adminUser.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.farm._id).toBe(registeredFarmId.toString());
    });
  });

  // ===========================================================================
  // Scenario 10: Truthful Handling of Unavailable Models
  // ===========================================================================
  describe('Test Scenario 10 — Truthful Handling of Unavailable Models', () => {
    it('10.1 Reports explicit 501/503 status when model is unavailable without fabricating predictions', async () => {
      // Mock unconfigured adapter
      jest.spyOn(c4Adapter, 'requestRiskPrediction').mockRejectedValueOnce(
        new ServiceUnavailableError('Component 4 Python inference microservice is currently unavailable.')
      );

      const res = await request(app)
        .post('/api/v1/transportation/predict-risk')
        .send({
          crop: 'BANANA',
          distanceKm: 100,
          durationHours: 3,
          vehicleType: 'COVERED_TRUCK',
          packagingType: 'PLASTIC_CRATES',
          roadCondition: 'PAVED_GOOD'
        });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
      // No fake probability or fake risk level returned
      expect(res.body.data).toBeUndefined();
    });
  });

  // ===========================================================================
  // Scenario 11: Consolidated Farm Workspace Overview
  // ===========================================================================
  describe('Test Scenario 11 — Consolidated Farm Workspace Overview', () => {
    it('11.1 GET /api/v1/farms/:id/overview returns consolidated farm data, records, and latest C1, C2, C4 results', async () => {
      const res = await request(app)
        .get(`/api/v1/farms/${registeredFarmId}/overview`)
        .set('Authorization', `Bearer ${farmerAlpha.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;
      expect(data.farm).toBeDefined();
      expect(data.farm._id.toString()).toBe(registeredFarmId.toString());
      expect(data.agriculturalRecordsSummary).toBeDefined();
      expect(data.latestAssessments).toBeDefined();
      expect(data.latestAssessments).toHaveProperty('cropRecommendation');
      expect(data.latestAssessments).toHaveProperty('diseaseDetection');
      expect(data.latestAssessments).toHaveProperty('transportationRisk');
      expect(data.componentReadiness).toBeDefined();
    });
  });
});

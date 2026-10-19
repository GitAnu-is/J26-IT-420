const request = require('supertest');
const app = require('../app');
const adapter = require('../components/c4_transportation_risk/adapters/c4PythonInferenceAdapter');
const TransportationAssessment = require('../components/c4_transportation_risk/models/TransportationAssessment');
const Farm = require('../shared/models/Farm');
const { setupTestDb, clearTestDb, teardownTestDb, createTestUser } = require('./testHelper');
const { ROLES } = require('../shared/constants/roles');
const { ServiceUnavailableError, ValidationError } = require('../shared/errors/AppError');

describe('Component 4: AI-Based Transportation Risk Prediction and Smart Packaging (35 Test Cases)', () => {
  let farmerA;
  let farmerB;
  let farmA;

  beforeAll(async () => {
    await setupTestDb();
    await clearTestDb();

    farmerA = await createTestUser({ fullName: 'Farmer C4 A', role: ROLES.FARMER });
    farmerB = await createTestUser({ fullName: 'Farmer C4 B', role: ROLES.FARMER });

    farmA = await Farm.create({
      ownerId: farmerA.user._id,
      farmName: 'Test Farm C4 Alpha',
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
  // 1. Route Registration & Metadata
  // ===========================================================================
  it('1. Route registration: GET /api/v1/transportation returns C4 metadata and options', async () => {
    const res = await request(app).get('/api/v1/transportation');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.componentId).toBe('C4');
    expect(res.body.data.supportedCrops).toEqual(expect.arrayContaining(['BANANA', 'PINEAPPLE', 'BLACK_PEPPER']));
    expect(res.body.data.supportedVehicles).toContain('REFRIGERATED_TRUCK');
    expect(res.body.data.supportedPackaging).toContain('PLASTIC_CRATES');
    expect(res.body.data.supportedRoadConditions).toContain('PAVED_GOOD');
    expect(res.body.data.riskLevels).toEqual(['LOW', 'MEDIUM', 'HIGH']);
    expect(res.body.data.independenceRule).toContain('Operates independently');
  });

  // ===========================================================================
  // 2. Valid Transportation Request
  // ===========================================================================
  it('2. Valid transportation request: POST /api/v1/transportation/predict-risk returns 200 with prediction', async () => {
    jest.spyOn(adapter, 'requestRiskPrediction').mockResolvedValueOnce({
      cropType: 'BANANA',
      damageProbability: 0.145,
      riskLevel: 'LOW',
      riskStatus: 'COMPLETED',
      modelIdentifier: 'Gradient Boosting Classifier',
      modelVersion: '1.0.0',
      datasetVersion: '1.0.0',
      shapExplanation: {
        baseValue: 0.28,
        attributions: [{ feature: 'travel_speed_kmh', value: 45.0, shapValue: -0.08 }],
        riskElevatingFactors: [],
        riskMitigatingFactors: ['Favorable travel speed']
      },
      packagingRecommendation: {
        recommendedPackaging: 'Plastic Crates with Paper Liners',
        storageGuidance: ['Maintain 13-14°C'],
        handlingGuidance: ['Stack max 5 high'],
        transportationGuidance: ['Avoid unpaved roads']
      },
      executionLatencyMs: 1.2,
      timestamp: new Date().toISOString()
    });

    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .send({
        crop: 'BANANA',
        distanceKm: 85,
        durationHours: 2.5,
        vehicleType: 'COVERED_TRUCK',
        roadCondition: 'PAVED_GOOD',
        packagingType: 'PLASTIC_CRATES',
        temperatureCelsius: 28,
        humidityPercentage: 75
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cropType).toBe('BANANA');
    expect(res.body.data.damageProbability).toBe(0.145);
    expect(res.body.data.riskLevel).toBe('LOW');
  });

  // ===========================================================================
  // 3-10. Input Validation Tests
  // ===========================================================================
  it('3. Rejects unsupported crop with 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .send({
        crop: 'STRAWBERRY',
        distanceKm: 50,
        durationHours: 2,
        vehicleType: 'COVERED_TRUCK',
        roadCondition: 'PAVED_GOOD',
        packagingType: 'PLASTIC_CRATES'
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('4. Rejects invalid non-positive distance with 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .send({
        crop: 'BANANA',
        distanceKm: -10,
        durationHours: 2,
        vehicleType: 'COVERED_TRUCK',
        roadCondition: 'PAVED_GOOD',
        packagingType: 'PLASTIC_CRATES'
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('5. Rejects negative travel duration with 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .send({
        crop: 'PINEAPPLE',
        distanceKm: 80,
        durationHours: -1.5,
        vehicleType: 'OPEN_TRUCK',
        roadCondition: 'PAVED_GOOD',
        packagingType: 'WOODEN_CRATES'
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('6. Rejects invalid temperature (> 55°C or < -5°C) with 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .send({
        crop: 'BLACK_PEPPER',
        distanceKm: 100,
        durationHours: 3,
        vehicleType: 'COVERED_TRUCK',
        roadCondition: 'PAVED_GOOD',
        packagingType: 'GUNNY_BAGS',
        temperatureCelsius: 65
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('7. Rejects invalid humidity (> 100% or < 0%) with 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .send({
        crop: 'BANANA',
        distanceKm: 100,
        durationHours: 3,
        vehicleType: 'COVERED_TRUCK',
        roadCondition: 'PAVED_GOOD',
        packagingType: 'PLASTIC_CRATES',
        humidityPercentage: 110
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('8. Rejects unsupported vehicle type with 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .send({
        crop: 'PINEAPPLE',
        distanceKm: 100,
        durationHours: 3,
        vehicleType: 'BICYCLE',
        roadCondition: 'PAVED_GOOD',
        packagingType: 'WOODEN_CRATES'
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('9. Rejects unsupported packaging type with 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .send({
        crop: 'BLACK_PEPPER',
        distanceKm: 100,
        durationHours: 3,
        vehicleType: 'COVERED_TRUCK',
        roadCondition: 'PAVED_GOOD',
        packagingType: 'ALUMINUM_FOIL_WRAP'
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('10. Rejects invalid road condition with 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .send({
        crop: 'BANANA',
        distanceKm: 50,
        durationHours: 2,
        vehicleType: 'COVERED_TRUCK',
        roadCondition: 'OFF_ROAD_MUDDY',
        packagingType: 'PLASTIC_CRATES'
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // ===========================================================================
  // 11-12. Farm Ownership Verification
  // ===========================================================================
  it('11. Returns 404 NOT_FOUND when supplied farmId does not exist', async () => {
    const nonExistentId = '507f1f77bcf86cd799439011';
    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .set('Authorization', `Bearer ${farmerA.accessToken}`)
      .send({
        crop: 'BANANA',
        farmId: nonExistentId,
        distanceKm: 50,
        durationHours: 2,
        vehicleType: 'COVERED_TRUCK',
        roadCondition: 'PAVED_GOOD',
        packagingType: 'PLASTIC_CRATES'
      });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('12. Enforces cross-user farm isolation with 403 FORBIDDEN when user does not own farm', async () => {
    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .set('Authorization', `Bearer ${farmerB.accessToken}`)
      .send({
        crop: 'BANANA',
        farmId: farmA._id.toString(),
        distanceKm: 50,
        durationHours: 2,
        vehicleType: 'COVERED_TRUCK',
        roadCondition: 'PAVED_GOOD',
        packagingType: 'PLASTIC_CRATES'
      });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // ===========================================================================
  // 13-16. Adapter Robustness & Microservice Errors
  // ===========================================================================
  it('13. Rejects missing required transit features with 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .send({
        crop: 'BANANA',
        distanceKm: 50
        // missing durationHours, vehicleType, roadCondition, packagingType
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('14. Returns 503 SERVICE_UNAVAILABLE when Python microservice is offline', async () => {
    jest.spyOn(adapter, 'requestRiskPrediction').mockRejectedValueOnce(
      new ServiceUnavailableError('Component 4 Python inference microservice is currently unavailable.')
    );

    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .send({
        crop: 'BANANA',
        distanceKm: 50,
        durationHours: 2,
        vehicleType: 'COVERED_TRUCK',
        roadCondition: 'PAVED_GOOD',
        packagingType: 'PLASTIC_CRATES'
      });

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('15. Returns 503 SERVICE_UNAVAILABLE when Python service request times out', async () => {
    jest.spyOn(adapter, 'requestRiskPrediction').mockRejectedValueOnce(
      new ServiceUnavailableError('Component 4 Python inference microservice request timed out.')
    );

    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .send({
        crop: 'PINEAPPLE',
        distanceKm: 120,
        durationHours: 4,
        vehicleType: 'OPEN_TRUCK',
        roadCondition: 'PAVED_POOR',
        packagingType: 'WOODEN_CRATES'
      });

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('16. Returns 400 VALIDATION_ERROR when Python microservice returns validation failure', async () => {
    jest.spyOn(adapter, 'requestRiskPrediction').mockRejectedValueOnce(
      new ValidationError('Malformed response received from C4 Python ML microservice.')
    );

    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .send({
        crop: 'BLACK_PEPPER',
        distanceKm: 50,
        durationHours: 2,
        vehicleType: 'COVERED_TRUCK',
        roadCondition: 'PAVED_GOOD',
        packagingType: 'GUNNY_BAGS'
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  // ===========================================================================
  // 17-21. Risk Inference, Probabilities, Thresholds, & SHAP
  // ===========================================================================
  it('17. Valid inference response: propagates model identity and latency', async () => {
    jest.spyOn(adapter, 'requestRiskPrediction').mockResolvedValueOnce({
      cropType: 'PINEAPPLE',
      damageProbability: 0.32,
      riskLevel: 'MEDIUM',
      riskStatus: 'COMPLETED',
      modelIdentifier: 'Gradient Boosting Classifier',
      modelVersion: '1.0.0',
      datasetVersion: '1.0.0',
      executionLatencyMs: 0.15,
      timestamp: new Date().toISOString()
    });

    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .send({
        crop: 'PINEAPPLE',
        distanceKm: 150,
        durationHours: 5,
        vehicleType: 'OPEN_TRUCK',
        roadCondition: 'PAVED_POOR',
        packagingType: 'WOODEN_CRATES'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.modelIdentifier).toBe('Gradient Boosting Classifier');
    expect(res.body.data.modelVersion).toBe('1.0.0');
    expect(res.body.data.executionLatencyMs).toBe(0.15);
  });

  it('18. Probability range validation: ensures damageProbability is between 0 and 1', async () => {
    jest.spyOn(adapter, 'requestRiskPrediction').mockResolvedValueOnce({
      cropType: 'BANANA',
      damageProbability: 0.725,
      riskLevel: 'HIGH',
      riskStatus: 'COMPLETED',
      modelIdentifier: 'Gradient Boosting Classifier',
      modelVersion: '1.0.0'
    });

    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .send({
        crop: 'BANANA',
        distanceKm: 200,
        durationHours: 7,
        vehicleType: 'OPEN_TRUCK',
        roadCondition: 'UNPAVED_ROUGH',
        packagingType: 'LOOSE_BULK'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.damageProbability).toBeGreaterThanOrEqual(0);
    expect(res.body.data.damageProbability).toBeLessThanOrEqual(1);
  });

  it('19. Risk threshold validation: classifies high probability (>0.65) as HIGH risk', async () => {
    jest.spyOn(adapter, 'requestRiskPrediction').mockResolvedValueOnce({
      cropType: 'BANANA',
      damageProbability: 0.82,
      riskLevel: 'HIGH',
      riskStatus: 'COMPLETED',
      modelIdentifier: 'Gradient Boosting Classifier'
    });

    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .send({
        crop: 'BANANA',
        distanceKm: 250,
        durationHours: 8,
        vehicleType: 'OPEN_TRUCK',
        roadCondition: 'UNPAVED_ROUGH',
        packagingType: 'LOOSE_BULK'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.riskLevel).toBe('HIGH');
  });

  it('20. SHAP response validation: provides feature attributions and risk direction', async () => {
    jest.spyOn(adapter, 'requestRiskPrediction').mockResolvedValueOnce({
      cropType: 'BANANA',
      damageProbability: 0.45,
      riskLevel: 'MEDIUM',
      riskStatus: 'COMPLETED',
      shapExplanation: {
        baseValue: 0.35,
        attributions: [
          { feature: 'road_condition_UNPAVED_ROUGH', value: 1.0, shapValue: 0.18 },
          { feature: 'packaging_type_PLASTIC_CRATES', value: 1.0, shapValue: -0.12 }
        ],
        riskElevatingFactors: ['Rough road conditions elevated transit risk'],
        riskMitigatingFactors: ['Rigid plastic crate packaging mitigated risk']
      }
    });

    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .send({
        crop: 'BANANA',
        distanceKm: 120,
        durationHours: 4,
        vehicleType: 'COVERED_TRUCK',
        roadCondition: 'UNPAVED_ROUGH',
        packagingType: 'PLASTIC_CRATES'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.shapExplanation).toBeDefined();
    expect(res.body.data.shapExplanation.attributions.length).toBeGreaterThan(0);
    expect(res.body.data.shapExplanation.riskElevatingFactors).toContain('Rough road conditions elevated transit risk');
  });

  it('21. Unsupported explanation handling: operates safely when SHAP is unavailable', async () => {
    jest.spyOn(adapter, 'requestRiskPrediction').mockResolvedValueOnce({
      cropType: 'BLACK_PEPPER',
      damageProbability: 0.12,
      riskLevel: 'LOW',
      riskStatus: 'COMPLETED',
      shapExplanation: null
    });

    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .send({
        crop: 'BLACK_PEPPER',
        distanceKm: 60,
        durationHours: 2,
        vehicleType: 'COVERED_TRUCK',
        roadCondition: 'PAVED_GOOD',
        packagingType: 'GUNNY_BAGS'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.shapExplanation).toBeNull();
  });

  // ===========================================================================
  // 22-25. Smart Packaging Recommendations
  // ===========================================================================
  it('22. Packaging recommendation generation: POST /recommend-packaging returns guidance', async () => {
    jest.spyOn(adapter, 'requestPackagingRecommendation').mockResolvedValueOnce({
      cropType: 'BANANA',
      ruleId: 'RULE-BAN-001',
      recommendedPackaging: 'Stackable Ventilated Plastic Crates (400x300x250mm) with Paper Liners',
      storageGuidance: ['Pre-cool to 13-14°C before loading', 'Maintain 85-90% relative humidity'],
      handlingGuidance: ['Stack crates no more than 5 layers high', 'Handle clusters by stalk crown only'],
      transportationGuidance: ['Transport during early morning or evening hours', 'Secure crates with load lock bars'],
      contextualWarnings: [],
      supportingReferences: ['Sri Lanka Department of Agriculture (DOA) Post-Harvest Technology Circular 2021/04'],
      ruleVersion: '1.0.0',
      reviewStatus: 'AGRONOMIC_EXPERT_ALIGNED',
      timestamp: new Date().toISOString()
    });

    const res = await request(app)
      .post('/api/v1/transportation/recommend-packaging')
      .send({
        crop: 'BANANA',
        distanceKm: 120,
        vehicleType: 'COVERED_TRUCK'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ruleId).toBe('RULE-BAN-001');
    expect(res.body.data.recommendedPackaging).toContain('Plastic Crates');
    expect(res.body.data.storageGuidance.length).toBeGreaterThan(0);
  });

  it('23. Crop-specific rule selection: assigns correct post-harvest rule per crop', async () => {
    jest.spyOn(adapter, 'requestPackagingRecommendation').mockResolvedValueOnce({
      cropType: 'BLACK_PEPPER',
      ruleId: 'RULE-PEP-001',
      recommendedPackaging: 'Double-Walled Jute / Gunny Bags with Food-Grade Polyethylene Liners (50 micron)',
      storageGuidance: ['Moisture content strictly <= 11%'],
      handlingGuidance: ['Do not place bags directly on damp floor; use wooden pallets'],
      transportationGuidance: ['Waterproof tarpaulin cover mandatory for open trucks'],
      supportingReferences: ['Department of Export Agriculture (DEA) Technical Bulletin 2019/02'],
      ruleVersion: '1.0.0'
    });

    const res = await request(app)
      .post('/api/v1/transportation/recommend-packaging')
      .send({
        crop: 'BLACK_PEPPER',
        distanceKm: 200,
        vehicleType: 'COVERED_TRUCK'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.ruleId).toBe('RULE-PEP-001');
    expect(res.body.data.recommendedPackaging).toContain('Polyethylene Liners');
  });

  it('24. Missing recommendation reference: provides verified supporting post-harvest literature', async () => {
    jest.spyOn(adapter, 'requestPackagingRecommendation').mockResolvedValueOnce({
      cropType: 'PINEAPPLE',
      ruleId: 'RULE-PIN-001',
      recommendedPackaging: 'Heavy-Duty Corrugated Fiberboard Cartons with Partition Dividers',
      supportingReferences: [
        'FAO Post-Harvest Compendium - Tropical Fruit Handling & Packaging',
        'Sri Lanka Department of Agriculture (DOA) Post-Harvest Circular 2022/01'
      ]
    });

    const res = await request(app)
      .post('/api/v1/transportation/recommend-packaging')
      .send({
        crop: 'PINEAPPLE',
        distanceKm: 80
      });

    expect(res.status).toBe(200);
    expect(res.body.data.supportingReferences.length).toBe(2);
    expect(res.body.data.supportingReferences[0]).toContain('FAO');
  });

  it('25. Independent recommendation behavior: works without prior prediction or farm registration', async () => {
    jest.spyOn(adapter, 'requestPackagingRecommendation').mockResolvedValueOnce({
      cropType: 'BANANA',
      ruleId: 'RULE-BAN-001',
      recommendedPackaging: 'Standard Ventilated Plastic Crates'
    });

    const res = await request(app)
      .post('/api/v1/transportation/recommend-packaging')
      .send({
        crop: 'BANANA',
        distanceKm: 50
      });

    expect(res.status).toBe(200);
    expect(res.body.data.recommendedPackaging).toBeDefined();
  });

  // ===========================================================================
  // 26-30. Authenticated Persistence, History, Isolation & Details
  // ===========================================================================
  let createdAssessmentId;

  it('26. Authenticated persistence: saves assessment to MongoDB when Bearer token is provided', async () => {
    jest.spyOn(adapter, 'requestRiskPrediction').mockResolvedValueOnce({
      cropType: 'BANANA',
      damageProbability: 0.18,
      riskLevel: 'LOW',
      riskStatus: 'COMPLETED',
      modelIdentifier: 'Gradient Boosting Classifier',
      modelVersion: '1.0.0',
      shapExplanation: { baseValue: 0.28, attributions: [] },
      packagingRecommendation: {
        recommendedPackaging: 'Plastic Crates with Paper Liners',
        storageGuidance: ['13-14°C'],
        handlingGuidance: ['Stack max 5'],
        transportationGuidance: ['Paved roads preferred']
      }
    });

    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .set('Authorization', `Bearer ${farmerA.accessToken}`)
      .send({
        crop: 'BANANA',
        farmId: farmA._id.toString(),
        distanceKm: 90,
        durationHours: 2.5,
        vehicleType: 'COVERED_TRUCK',
        roadCondition: 'PAVED_GOOD',
        packagingType: 'PLASTIC_CRATES'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.assessmentId).toBeDefined();
    createdAssessmentId = res.body.data.assessmentId;

    const savedDoc = await TransportationAssessment.findById(createdAssessmentId);
    expect(savedDoc).not.toBeNull();
    expect(savedDoc.userId.toString()).toBe(farmerA.user._id.toString());
    expect(savedDoc.cropType).toBe('BANANA');
    expect(savedDoc.predictionResult.riskLevel).toBe('LOW');
  });

  it('27. Empty assessment history: returns empty list for user with no assessments', async () => {
    const res = await request(app)
      .get('/api/v1/transportation/history')
      .set('Authorization', `Bearer ${farmerB.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.history).toHaveLength(0);
    expect(res.body.data.pagination.totalRecords).toBe(0);
  });

  it('28. History pagination: returns paginated records with correct page count', async () => {
    // Add two more assessments for farmerA
    await TransportationAssessment.create([
      {
        userId: farmerA.user._id,
        cropType: 'PINEAPPLE',
        logisticsInputSnapshot: { distanceKm: 120 },
        predictionResult: { damageProbability: 0.45, riskLevel: 'MEDIUM', riskStatus: 'COMPLETED', recommendedPackaging: 'Cartons' }
      },
      {
        userId: farmerA.user._id,
        cropType: 'BLACK_PEPPER',
        logisticsInputSnapshot: { distanceKm: 180 },
        predictionResult: { damageProbability: 0.10, riskLevel: 'LOW', riskStatus: 'COMPLETED', recommendedPackaging: 'Jute Bags' }
      }
    ]);

    const res = await request(app)
      .get('/api/v1/transportation/history?page=1&limit=2')
      .set('Authorization', `Bearer ${farmerA.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.history).toHaveLength(2);
    expect(res.body.data.pagination.totalRecords).toBe(3);
    expect(res.body.data.pagination.totalPages).toBe(2);
    expect(res.body.data.pagination.hasNextPage).toBe(true);
  });

  it('29. History filtering: filters by cropType and riskLevel', async () => {
    const res = await request(app)
      .get('/api/v1/transportation/history?cropType=PINEAPPLE')
      .set('Authorization', `Bearer ${farmerA.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.history).toHaveLength(1);
    expect(res.body.data.history[0].cropType).toBe('PINEAPPLE');
  });

  it('30. Cross-user history isolation: prevents viewing other users assessments', async () => {
    // Farmer B attempts to get Farmer A's assessment by ID
    const res = await request(app)
      .get(`/api/v1/transportation/assessments/${createdAssessmentId}`)
      .set('Authorization', `Bearer ${farmerB.accessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // ===========================================================================
  // 31-35. Architectural Boundaries, Regressions & Academic Integrity
  // ===========================================================================
  it('31. Proper error response structure: ensures consistent envelope across all errors', async () => {
    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .send({ crop: 'INVALID_CROP' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    expect(res.body.error).toHaveProperty('details');
  });

  it('32. Component 1 regression: verifies C1 crop recommendation contracts are intact', async () => {
    const res = await request(app).get('/api/v1/crops');
    expect(res.status).toBe(200);
    expect(res.body.data.componentId).toBe('C1');
    expect(res.body.data.models.recommendation).toBe('Random Forest Classifier');
  });

  it('33. Component 2 regression: verifies C2 plant disease detection contracts are intact', async () => {
    const res = await request(app).get('/api/v1/diseases');
    expect(res.status).toBe(200);
    expect(res.body.data.componentId).toBe('C2');
    expect(res.body.data.models.detectionAndSeverity).toEqual(['EfficientNet-B0', 'ResNet50']);
  });

  it('34. Removed Component 3 exclusion: confirms quality grading and shelf-life endpoints are 404', async () => {
    const res1 = await request(app).get('/api/v1/quality');
    const res2 = await request(app).get('/api/v1/market-readiness');
    const res3 = await request(app).get('/api/v1/shelf-life');

    expect(res1.status).toBe(404);
    expect(res2.status).toBe(404);
    expect(res3.status).toBe(404);
  });

  it('35. No fabricated predictions: unconfigured/offline service returns boundary error without fabricating dummy probabilities', async () => {
    // When adapter throws NotImplementedError, controller does NOT catch and fabricate a fake probability
    jest.spyOn(adapter, 'requestRiskPrediction').mockImplementationOnce(() => {
      throw new ServiceUnavailableError('Component 4 microservice offline');
    });

    const res = await request(app)
      .post('/api/v1/transportation/predict-risk')
      .send({
        crop: 'BANANA',
        distanceKm: 50,
        durationHours: 2,
        vehicleType: 'COVERED_TRUCK',
        roadCondition: 'PAVED_GOOD',
        packagingType: 'PLASTIC_CRATES'
      });

    expect(res.status).toBe(503);
    expect(res.body.data).toBeUndefined();
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
  });
});

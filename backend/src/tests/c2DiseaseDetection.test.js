const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../app');
const adapter = require('../components/c2_disease_detection/adapters/c2PythonInferenceAdapter');
const imageStorageService = require('../components/c2_disease_detection/services/imageStorageService');
const DiseaseAssessment = require('../components/c2_disease_detection/models/DiseaseAssessment');
const Farm = require('../shared/models/Farm');
const { setupTestDb, clearTestDb, teardownTestDb, createTestUser } = require('./testHelper');
const { ROLES } = require('../shared/constants/roles');
const { ServiceUnavailableError, ValidationError } = require('../shared/errors/AppError');

describe('Component 2: Plant Disease Detection & Severity Assessment System', () => {
  let farmerA;
  let farmerB;
  let farmA;

  // Genuine 1x1 24-bit RGB JPEG buffer fixture
  const validJpegBuffer = Buffer.from([
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

  // Genuine 1x1 PNG buffer fixture
  const validPngBuffer = Buffer.from(
    '89504e470d0a1a0a0000000d4948445200000020000000200802000000fc18ed' +
    'a30000001949444154789c6364f80f0001040100ffff03000025001104d445cc' +
    '0000000049454e44ae426082',
    'hex'
  );

  beforeAll(async () => {
    await setupTestDb();
    await clearTestDb();

    farmerA = await createTestUser({ fullName: 'Farmer C2 Alpha', role: ROLES.FARMER });
    farmerB = await createTestUser({ fullName: 'Farmer C2 Beta', role: ROLES.FARMER });

    farmA = await Farm.create({
      ownerId: farmerA.user._id,
      farmName: 'Gampaha Banana Plantation',
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
  // 1. Component 2 Route Registration & Info
  // ===========================================================================
  it('1. GET /api/v1/diseases returns component metadata and supported crops', async () => {
    const res = await request(app).get('/api/v1/diseases');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.componentId).toBe('C2');
    expect(res.body.data.supportedCrops).toEqual(expect.arrayContaining(['BANANA', 'PINEAPPLE', 'BLACK_PEPPER']));
    expect(res.body.data.models).toHaveProperty('proposed');
  });

  // ===========================================================================
  // 2-6. Image Upload & Magic Byte File Validation
  // ===========================================================================
  it('2. POST /api/v1/diseases/analyze successfully accepts valid multipart image upload', async () => {
    jest.spyOn(adapter, 'requestDiseaseAnalysis').mockResolvedValueOnce({
      cropType: 'BANANA',
      predictedDisease: 'BANANA___SIGATOKA',
      diseaseNameDisplay: 'Sigatoka Leaf Spot',
      confidence: 0.945,
      classProbabilities: { 'BANANA___SIGATOKA': 0.945, 'BANANA___HEALTHY': 0.055 },
      severity: 'MEDIUM',
      severityStatus: 'COMPLETED',
      severityMethod: 'Pixel-level lesion area quantification',
      gradCamBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      managementGuidance: ['Deleaf infected foliage', 'Apply registered protective fungicide'],
      guidanceCitation: 'Department of Agriculture Sri Lanka - DOA Peradeniya',
      modelIdentifier: 'c2_efficientnet_b0',
      modelVersion: 'v1.0',
      predictionStatus: 'COMPLETED',
      executionLatencyMs: 45.2
    });

    const res = await request(app)
      .post('/api/v1/diseases/analyze')
      .set('Authorization', `Bearer ${farmerA.accessToken}`)
      .field('crop', 'BANANA')
      .field('farmId', farmA._id.toString())
      .attach('image', validJpegBuffer, 'banana_leaf.jpg');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.predictedDisease).toBe('BANANA___SIGATOKA');
    expect(res.body.data.confidence).toBe(0.945);
    expect(res.body.data.imageReference).toBeDefined();
    expect(res.body.data.gradCamArtifactReference).toBeDefined();
    expect(res.body.data.savedAssessmentId).toBeDefined();
  });

  it('3. Rejects unsupported image MIME type with 400 Validation Error', async () => {
    const textBuffer = Buffer.from('Plain text content disguised as an image');
    const res = await request(app)
      .post('/api/v1/diseases/analyze')
      .field('crop', 'BANANA')
      .attach('image', textBuffer, 'notes.txt');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('4. Rejects file extension spoofing (text file named .jpg with non-image bytes)', async () => {
    const maliciousBuffer = Buffer.from('<?php echo "malware"; ?> not a genuine image file');
    const res = await request(app)
      .post('/api/v1/diseases/analyze')
      .field('crop', 'BANANA')
      .attach('image', maliciousBuffer, 'malicious.jpg');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Unsupported image file type|Only genuine JPEG/i);
  });

  it('5. Rejects oversized image uploads exceeding 8 MB limit with 400', async () => {
    const oversizedBuffer = Buffer.alloc(8.5 * 1024 * 1024); // 8.5 MB
    const res = await request(app)
      .post('/api/v1/diseases/analyze')
      .field('crop', 'BANANA')
      .attach('image', oversizedBuffer, 'oversized.jpg');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/exceeds the maximum permitted size|8 MB/i);
  });

  it('6. Rejects truncated or corrupted image byte streams with 400', async () => {
    const corruptBuffer = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01, 0x02]); // Truncated header
    const res = await request(app)
      .post('/api/v1/diseases/analyze')
      .field('crop', 'PINEAPPLE')
      .attach('image', corruptBuffer, 'corrupt.jpg');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ===========================================================================
  // 7-11. Crop Selection & Farm Ownership Validation
  // ===========================================================================
  it('7. Rejects invalid crop parameter with 400 Validation Error', async () => {
    const res = await request(app)
      .post('/api/v1/diseases/analyze')
      .field('crop', 'INVALID_CROP_TYPE')
      .attach('image', validJpegBuffer, 'leaf.jpg');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('8. Rejects unsupported agricultural crop (e.g. WATERMELON) with 400', async () => {
    const res = await request(app)
      .post('/api/v1/diseases/analyze')
      .field('crop', 'WATERMELON')
      .attach('image', validJpegBuffer, 'leaf.jpg');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('9. Rejects analyze request when no image file or imageBase64 is provided', async () => {
    const res = await request(app)
      .post('/api/v1/diseases/analyze')
      .field('crop', 'BANANA');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/image file|must be provided/i);
  });

  it('10. Rejects malformed farm ID format with 400 Validation Error', async () => {
    const res = await request(app)
      .post('/api/v1/diseases/analyze')
      .field('crop', 'BANANA')
      .field('farmId', 'malformed-123')
      .attach('image', validJpegBuffer, 'leaf.jpg');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Invalid farm ID format');
  });

  it('11. CROSS-USER ISOLATION: Rejects using another farmer farmId with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/diseases/analyze')
      .set('Authorization', `Bearer ${farmerB.accessToken}`) // Farmer B
      .field('crop', 'BANANA')
      .field('farmId', farmA._id.toString()) // Farmer A's farm
      .attach('image', validJpegBuffer, 'leaf.jpg');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/permission/i);
  });

  // ===========================================================================
  // 12-14. Storage, Traversal Protection & Failure Cleanup
  // ===========================================================================
  it('12. Prevents unauthorized cross-user assessment access with 403 Forbidden', async () => {
    const assessment = await DiseaseAssessment.create({
      userId: farmerA.user._id,
      cropType: 'BANANA',
      imageReference: 'plant_test_123.jpg',
      predictionResult: {
        diseaseName: 'BANANA___SIGATOKA',
        confidence: 0.95,
        severity: 'Medium',
        managementGuidance: ['Prune leaves']
      }
    });

    const res = await request(app)
      .get(`/api/v1/diseases/assessments/${assessment._id}`)
      .set('Authorization', `Bearer ${farmerB.accessToken}`); // Farmer B

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('13. Storage key generator produces safe filenames without path traversal characters', () => {
    const key = imageStorageService.generateStorageKey('plant', 'jpg');
    expect(key).toMatch(/^plant_\d+_[a-f0-9]+\.jpg$/);
    expect(key).not.toContain('..');
    expect(key).not.toContain('/');
    expect(key).not.toContain('\\');
  });

  it('14. Safely cleans up uploaded original image file when inference fails', async () => {
    const deleteSpy = jest.spyOn(imageStorageService, 'deleteArtifact');
    jest.spyOn(adapter, 'requestDiseaseAnalysis').mockRejectedValueOnce(
      new ServiceUnavailableError('Inference service connection timeout')
    );

    const res = await request(app)
      .post('/api/v1/diseases/analyze')
      .field('crop', 'BANANA')
      .attach('image', validJpegBuffer, 'test_cleanup.jpg');

    expect(res.status).toBe(503);
    expect(deleteSpy).toHaveBeenCalledWith(expect.stringMatching(/^plant_/), 'original');
  });

  // ===========================================================================
  // 15-18. Adapter Resiliency & Status Code Handling
  // ===========================================================================
  it('15. Returns explicit 503 when C2 Python inference microservice is unreachable', async () => {
    jest.spyOn(adapter, 'requestDiseaseAnalysis').mockRejectedValueOnce(
      new ServiceUnavailableError('Component 2 Python inference service is temporarily unreachable')
    );

    const res = await request(app)
      .post('/api/v1/diseases/analyze')
      .field('crop', 'BANANA')
      .attach('image', validJpegBuffer, 'leaf.jpg');

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
  });

  it('16. Returns 503 when Python microservice times out', async () => {
    jest.spyOn(adapter, 'requestDiseaseAnalysis').mockRejectedValueOnce(
      new ServiceUnavailableError('Inference network timeout')
    );

    const res = await request(app)
      .post('/api/v1/diseases/analyze')
      .field('crop', 'PINEAPPLE')
      .attach('image', validPngBuffer, 'pineapple.png');

    expect(res.status).toBe(503);
  });

  it('17. Rejects malformed Python response missing predictedDisease with 400', async () => {
    jest.spyOn(adapter, 'requestDiseaseAnalysis').mockRejectedValueOnce(
      new ValidationError('Malformed prediction response from disease detection machine learning service', [
        { field: 'predictedDisease', message: 'Missing predicted disease classification in response' }
      ])
    );

    const res = await request(app)
      .post('/api/v1/diseases/analyze')
      .field('crop', 'BANANA')
      .attach('image', validJpegBuffer, 'leaf.jpg');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('18. Maps valid Python prediction response fields completely', async () => {
    jest.spyOn(adapter, 'requestDiseaseAnalysis').mockResolvedValueOnce({
      cropType: 'BLACK_PEPPER',
      predictedDisease: 'BLACK_PEPPER___QUICK_WILT',
      diseaseNameDisplay: 'Quick Wilt / Foot Rot (Phytophthora capsici)',
      confidence: 0.965,
      classProbabilities: { 'BLACK_PEPPER___QUICK_WILT': 0.965, 'BLACK_PEPPER___HEALTHY': 0.035 },
      severity: 'HIGH',
      severityStatus: 'COMPLETED',
      severityMethod: 'Pixel-level lesion area quantification',
      gradCamBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      managementGuidance: ['Paint collar with 1% Bordeaux mixture', 'Drench root zone with Potassium Phosphonate'],
      guidanceCitation: 'Department of Export Agriculture (DEA) Sri Lanka',
      modelIdentifier: 'c2_efficientnet_b0',
      modelVersion: 'v1.0',
      predictionStatus: 'COMPLETED',
      executionLatencyMs: 38.6
    });

    const res = await request(app)
      .post('/api/v1/diseases/analyze')
      .field('crop', 'BLACK_PEPPER')
      .attach('image', validJpegBuffer, 'pepper.jpg');

    expect(res.status).toBe(200);
    expect(res.body.data.cropType).toBe('BLACK_PEPPER');
    expect(res.body.data.predictedDisease).toBe('BLACK_PEPPER___QUICK_WILT');
    expect(res.body.data.diseaseNameDisplay).toContain('Quick Wilt');
    expect(res.body.data.confidence).toBe(0.965);
    expect(res.body.data.severity).toBe('HIGH');
    expect(res.body.data.managementGuidance).toHaveLength(2);
  });

  // ===========================================================================
  // 19-21. Severity, Grad-CAM & Management Guidance
  // ===========================================================================
  it('19. Transparently returns severity as UNAVAILABLE when independent lesion masks are absent', async () => {
    jest.spyOn(adapter, 'requestDiseaseAnalysis').mockResolvedValueOnce({
      cropType: 'BANANA',
      predictedDisease: 'BANANA___BUNCHY_TOP',
      diseaseNameDisplay: 'Banana Bunchy Top Virus',
      confidence: 0.89,
      classProbabilities: { 'BANANA___BUNCHY_TOP': 0.89 },
      severity: null,
      severityStatus: 'UNAVAILABLE',
      severityMethod: 'Requires independent expert-annotated lesion segmentation masks.',
      gradCamBase64: null,
      managementGuidance: ['Uproot and destroy infected mats immediately'],
      modelIdentifier: 'c2_efficientnet_b0',
      modelVersion: 'v1.0',
      predictionStatus: 'COMPLETED',
      executionLatencyMs: 40.0
    });

    const res = await request(app)
      .post('/api/v1/diseases/analyze')
      .field('crop', 'BANANA')
      .attach('image', validJpegBuffer, 'bbtv.jpg');

    expect(res.status).toBe(200);
    expect(res.body.data.severity).toBeNull();
    expect(res.body.data.severityStatus).toBe('UNAVAILABLE');
    expect(res.body.data.severityMethod).toContain('lesion segmentation masks');
  });

  it('20. Associates and persists Grad-CAM artifact reference when generated', async () => {
    jest.spyOn(adapter, 'requestDiseaseAnalysis').mockResolvedValueOnce({
      cropType: 'PINEAPPLE',
      predictedDisease: 'PINEAPPLE___HEART_ROT',
      diseaseNameDisplay: 'Heart Rot / Top Rot',
      confidence: 0.91,
      classProbabilities: { 'PINEAPPLE___HEART_ROT': 0.91 },
      severity: null,
      severityStatus: 'UNAVAILABLE',
      gradCamBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      managementGuidance: ['Construct raised beds', 'Dip planting suckers in fungicide'],
      modelIdentifier: 'c2_efficientnet_b0',
      modelVersion: 'v1.0',
      predictionStatus: 'COMPLETED',
      executionLatencyMs: 50.0
    });

    const res = await request(app)
      .post('/api/v1/diseases/analyze')
      .set('Authorization', `Bearer ${farmerA.accessToken}`)
      .field('crop', 'PINEAPPLE')
      .attach('image', validPngBuffer, 'pineapple.png');

    expect(res.status).toBe(200);
    expect(res.body.data.gradCamArtifactReference).toBeDefined();
    expect(res.body.data.gradCamArtifactReference).toMatch(/^gradcam_/);
  });

  it('21. Matches verified agricultural management guidance to detected disease', async () => {
    jest.spyOn(adapter, 'requestDiseaseAnalysis').mockResolvedValueOnce({
      cropType: 'BANANA',
      predictedDisease: 'BANANA___SIGATOKA',
      diseaseNameDisplay: 'Sigatoka Leaf Spot',
      confidence: 0.92,
      classProbabilities: { 'BANANA___SIGATOKA': 0.92 },
      severity: null,
      severityStatus: 'UNAVAILABLE',
      managementGuidance: [
        'Deleaf and prune necrotic leaves',
        'Improve field drainage to lower relative humidity beneath canopy'
      ],
      guidanceCitation: 'Department of Agriculture Sri Lanka - DOA Peradeniya',
      modelIdentifier: 'c2_efficientnet_b0',
      modelVersion: 'v1.0',
      predictionStatus: 'COMPLETED',
      executionLatencyMs: 42.0
    });

    const res = await request(app)
      .post('/api/v1/diseases/analyze')
      .field('crop', 'BANANA')
      .attach('image', validJpegBuffer, 'leaf.jpg');

    expect(res.status).toBe(200);
    expect(res.body.data.managementGuidance[0]).toContain('Deleaf and prune');
    expect(res.body.data.guidanceCitation).toContain('Department of Agriculture');
  });

  // ===========================================================================
  // 22-26. Database Persistence, History & Isolation
  // ===========================================================================
  it('22. Successfully persists validated assessment in MongoDB for authenticated farmer', async () => {
    jest.spyOn(adapter, 'requestDiseaseAnalysis').mockResolvedValueOnce({
      cropType: 'BANANA',
      predictedDisease: 'BANANA___HEALTHY',
      diseaseNameDisplay: 'Healthy Foliage',
      confidence: 0.98,
      classProbabilities: { 'BANANA___HEALTHY': 0.98 },
      severity: 'HEALTHY',
      severityStatus: 'NOT_APPLICABLE',
      gradCamBase64: null,
      managementGuidance: ['Maintain balanced nutrition'],
      modelIdentifier: 'c2_efficientnet_b0',
      modelVersion: 'v1.0',
      predictionStatus: 'COMPLETED',
      executionLatencyMs: 30.0
    });

    const res = await request(app)
      .post('/api/v1/diseases/analyze')
      .set('Authorization', `Bearer ${farmerA.accessToken}`)
      .field('crop', 'BANANA')
      .field('farmId', farmA._id.toString())
      .attach('image', validJpegBuffer, 'healthy.jpg');

    expect(res.status).toBe(200);
    expect(res.body.data.savedAssessmentId).toBeDefined();

    const savedDoc = await DiseaseAssessment.findById(res.body.data.savedAssessmentId);
    expect(savedDoc).toBeDefined();
    expect(savedDoc.userId.toString()).toBe(farmerA.user._id.toString());
    expect(savedDoc.cropType).toBe('BANANA');
    expect(savedDoc.predictionResult.diseaseName).toBe('BANANA___HEALTHY');
    expect(savedDoc.modelMetadata.modelName).toBe('c2_efficientnet_b0');
  });

  it('23. Retrieves empty history safely for farmer with no assessments', async () => {
    const res = await request(app)
      .get('/api/v1/diseases/history')
      .set('Authorization', `Bearer ${farmerB.accessToken}`); // Farmer B has no records

    expect(res.status).toBe(200);
    expect(res.body.data.history).toEqual([]);
    expect(res.body.data.pagination.totalRecords).toBe(0);
  });

  it('24. Supports assessment history pagination (page, limit, totalPages)', async () => {
    const res = await request(app)
      .get('/api/v1/diseases/history?page=1&limit=2')
      .set('Authorization', `Bearer ${farmerA.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.limit).toBe(2);
    expect(res.body.data.pagination.totalRecords).toBeGreaterThanOrEqual(1);
  });

  it('25. OWNERSHIP ISOLATION: Farmer B history does not contain Farmer A assessments', async () => {
    const resB = await request(app)
      .get('/api/v1/diseases/history')
      .set('Authorization', `Bearer ${farmerB.accessToken}`);

    expect(resB.status).toBe(200);
    const hasFarmerARecord = resB.body.data.history.some(
      (doc) => doc.userId.toString() === farmerA.user._id.toString()
    );
    expect(hasFarmerARecord).toBe(false);
  });

  it('26. Retrieves individual disease assessment by authorized ID', async () => {
    const assessment = await DiseaseAssessment.findOne({ userId: farmerA.user._id });
    expect(assessment).toBeDefined();

    const res = await request(app)
      .get(`/api/v1/diseases/assessments/${assessment._id}`)
      .set('Authorization', `Bearer ${farmerA.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.assessment._id.toString()).toBe(assessment._id.toString());
    expect(res.body.data.assessment.cropType).toBe(assessment.cropType);
  });

  // ===========================================================================
  // 27. Authorized Artifact Retrieval
  // ===========================================================================
  it('27. Protects Grad-CAM artifact endpoint: Farmer B cannot access Farmer A artifact', async () => {
    const assessment = await DiseaseAssessment.findOne({ userId: farmerA.user._id });
    expect(assessment).toBeDefined();

    const res = await request(app)
      .get(`/api/v1/diseases/assessments/${assessment._id}/gradcam`)
      .set('Authorization', `Bearer ${farmerB.accessToken}`); // Farmer B

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // ===========================================================================
  // 28-30. System Regressions, Boundaries & Absent Component 3
  // ===========================================================================
  it('28. REGRESSION: Component 1 crop recommendation endpoints remain operational', async () => {
    const res = await request(app).get('/api/v1/crops');
    expect(res.status).toBe(200);
    expect(res.body.data.componentId).toBe('C1');
  });

  it('29. BOUNDARY: Component 4 transportation risk endpoints remain isolated placeholders', async () => {
    const res = await request(app).get('/api/v1/transportation');
    expect(res.status).toBe(200);
    expect(res.body.data.componentId).toBe('C4');
  });

  it('30. ARCHITECTURAL BOUNDARY: Formally removed Component 3 endpoints remain absent (404)', async () => {
    const res1 = await request(app).get('/api/v1/quality');
    expect(res1.status).toBe(404);

    const res2 = await request(app).get('/api/v1/market-readiness');
    expect(res2.status).toBe(404);

    const res3 = await request(app).get('/api/v1/shelf-life');
    expect(res3.status).toBe(404);
  });
});

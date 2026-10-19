import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api/v1';

// Shared test session state
let authToken = '';
let refreshToken = '';
let testUserId = '';
let testFarmId = '';
let testRecordId = '';
let diseaseAssessmentId = '';
let transportAssessmentId = '';

const testEmail = `research_farmer_${Date.now()}@sliit.lk`;
const testPassword = 'Password123!Secure';

test('E2E 01: System Health & Microservices Readiness', async () => {
  const res = await fetch(`${BASE_URL}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.data.status, 'healthy');
  assert.equal(body.data.database.connected, true, 'MongoDB Atlas must be connected');

  // Verify all 3 AI microservices are active and optimal
  assert.equal(body.data.inferenceServicesSummary.overallInferenceStatus, 'OPTIMAL');
  assert.equal(body.data.inferenceServicesSummary.c1Ready, true, 'C1 ML service must be ready on 8001');
  assert.equal(body.data.inferenceServicesSummary.c2Ready, true, 'C2 ML service must be ready on 8002');
  assert.equal(body.data.inferenceServicesSummary.c4Ready, true, 'C4 ML service must be ready on 8003');
});

test('E2E 02: User Registration (fullName & Role enum)', async () => {
  const payload = {
    fullName: 'Dr. Anuradha Wijesinghe',
    email: testEmail,
    password: testPassword,
    role: 'FARMER',
    phoneNumber: '+94771234567'
  };

  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.data.accessToken);
  assert.ok(body.data.refreshToken);
  assert.equal(body.data.user.fullName, 'Dr. Anuradha Wijesinghe');
  assert.equal(body.data.user.role, 'FARMER');

  authToken = body.data.accessToken;
  refreshToken = body.data.refreshToken;
  testUserId = body.data.user.id || body.data.user._id;
});

test('E2E 03: User Login & Token Verification', async () => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword })
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.data.accessToken);
  authToken = body.data.accessToken;
});

test('E2E 04: Get Current User Profile (/auth/me)', async () => {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.data.user.email, testEmail);
});

test('E2E 05: Refresh Access Token (/auth/refresh)', async () => {
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.data.accessToken);
  authToken = body.data.accessToken;
});

test('E2E 06: Farm Management CRUD (Create, List, Overview)', async () => {
  // Create Farm
  const createRes = await fetch(`${BASE_URL}/farms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify({
      farmName: 'J26 Research Station Anuradhapura',
      district: 'Anuradhapura',
      agroEcologicalZone: 'DL1b',
      location: { latitude: 8.3114, longitude: 80.4037, address: 'Mahailluppallama Field 4' },
      soilType: 'RED_YELLOW_PODZOLIC',
      area: 8.5,
      areaUnit: 'ACRES',
      supportedCrops: ['BANANA', 'PINEAPPLE', 'BLACK_PEPPER']
    })
  });

  assert.equal(createRes.status, 201);
  const createBody = await createRes.json();
  assert.equal(createBody.success, true);
  const farmDoc = createBody.data.farm || createBody.data;
  testFarmId = farmDoc._id || farmDoc.id;
  assert.ok(testFarmId, 'Farm ID must be returned');

  // List Farms
  const listRes = await fetch(`${BASE_URL}/farms`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.equal(listRes.status, 200);
  const listBody = await listRes.json();
  const farmList = listBody.data.farms || listBody.data;
  assert.ok(farmList.some(f => (f.id || f._id) === testFarmId));

  // Farm Overview
  const overviewRes = await fetch(`${BASE_URL}/farms/${testFarmId}/overview`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.equal(overviewRes.status, 200);
  const overviewBody = await overviewRes.json();
  assert.equal(overviewBody.success, true);
  assert.equal(overviewBody.data.farm.farmName, 'J26 Research Station Anuradhapura');
  assert.ok(overviewBody.data.componentReadiness, 'Component readiness must be returned');
  assert.ok(overviewBody.data.latestAssessments, 'Latest assessments must be returned');
});

test('E2E 07: Agricultural Field Records CRUD', async () => {
  const createRes = await fetch(`${BASE_URL}/agricultural-records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify({
      farmId: testFarmId,
      cropType: 'BANANA',
      plantingDate: '2026-02-15',
      expectedHarvestDate: '2026-11-20',
      nitrogen: 120,
      phosphorus: 45,
      potassium: 160,
      soilPh: 6.4,
      soilMoisture: 33.5,
      notes: 'Cavendish sucker planting trial block 2'
    })
  });

  assert.equal(createRes.status, 201);
  const createBody = await createRes.json();
  assert.equal(createBody.success, true);
  const recordDoc = createBody.data.record || createBody.data;
  testRecordId = recordDoc._id || recordDoc.id;
  assert.ok(testRecordId, 'Record ID must be returned');

  // List Records
  const listRes = await fetch(`${BASE_URL}/agricultural-records?farmId=${testFarmId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.equal(listRes.status, 200);
  const listBody = await listRes.json();
  const recordList = listBody.data.records || listBody.data;
  assert.ok(recordList.some(r => (r.id || r._id) === testRecordId));
});

test('E2E 08: Component 1 — Live Crop Recommendation ML Inference', async () => {
  const res = await fetch(`${BASE_URL}/crops/recommend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify({
      farmId: testFarmId,
      district: 'Anuradhapura',
      soilType: 'RED_YELLOW_PODZOLIC',
      nitrogen: 110,
      phosphorus: 40,
      potassium: 140,
      ph: 6.5,
      temperatureCelsius: 29.5,
      rainfallMm: 125.0
    })
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.data.recommendedCrop);
  assert.ok(['BANANA', 'PINEAPPLE', 'BLACK_PEPPER'].includes(body.data.recommendedCrop));
  const probs = body.data.classProbabilities || body.data.probabilities;
  assert.ok(probs, 'Class probabilities must be returned');
  assert.ok(body.data.modelIdentifier);
});

test('E2E 09: Component 1 — Harvest Planning & Biological Reference Events', async () => {
  // 1. Banana (Planting date reference)
  const bananaRes = await fetch(`${BASE_URL}/crops/predict-harvest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify({
      crop: 'BANANA',
      farmId: testFarmId,
      plantingDate: '2026-03-01'
    })
  });

  assert.equal(bananaRes.status, 200);
  const bananaBody = await bananaRes.json();
  assert.equal(bananaBody.success, true);
  assert.ok(bananaBody.data.predictedDurationDays > 0);
  assert.ok(bananaBody.data.predictedHarvestDate || bananaBody.data.expectedHarvestDate);

  // 2. Black Pepper (Spike emergence / flowering reference)
  const pepperRes = await fetch(`${BASE_URL}/crops/predict-harvest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify({
      crop: 'BLACK_PEPPER',
      farmId: testFarmId,
      plantingDate: '2026-04-10'
    })
  });

  assert.equal(pepperRes.status, 200);
  const pepperBody = await pepperRes.json();
  assert.equal(pepperBody.success, true);
  assert.ok(pepperBody.data.predictedDurationDays > 0);
});

test('E2E 10: Component 2 — Disease Analysis via Multipart Upload', async () => {
  const sampleImagePath = path.join(__dirname, 'sample_leaf.jpg');
  const imageBuffer = fs.readFileSync(sampleImagePath);

  const formData = new FormData();
  formData.append('crop', 'BANANA');
  formData.append('farmId', testFarmId);
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
  formData.append('image', blob, 'sample_leaf.jpg');

  const res = await fetch(`${BASE_URL}/diseases/analyze`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}` },
    body: formData
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(body.data.predictedDisease || body.data.disease);
  assert.ok(body.data.confidence >= 0 && body.data.confidence <= 1);
  assert.ok(body.data.severityStatus);

  // Management recommendations present
  assert.ok(body.data.managementGuidance);

  diseaseAssessmentId = body.data.assessmentId || body.data.savedAssessmentId;
});

test('E2E 11: Component 2 — Grad-CAM Attention Heatmap Retrieval', async () => {
  if (!diseaseAssessmentId) return;

  const res = await fetch(`${BASE_URL}/diseases/assessments/${diseaseAssessmentId}/gradcam`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });

  // Returns 200 with heatmap image or 404 if not persisted for clean specimen
  assert.ok(res.status === 200 || res.status === 404);
  if (res.status === 200) {
    const contentType = res.headers.get('content-type');
    assert.ok(contentType.includes('image'));
  }
});

test('E2E 12: Component 4 — Transportation Risk Prediction with SHAP', async () => {
  const payload = {
    crop: 'PINEAPPLE',
    farmId: testFarmId,
    distanceKm: 180,
    durationHours: 6.0,
    vehicleType: 'COVERED_TRUCK',
    packagingType: 'CORRUGATED_BOXES',
    roadCondition: 'PAVED_GOOD',
    temperatureCelsius: 28,
    humidityPercentage: 78,
    originDistrict: 'Gampaha',
    destinationDistrict: 'Dambulla'
  };

  const res = await fetch(`${BASE_URL}/transportation/predict-risk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.data.cropType, 'PINEAPPLE');
  assert.ok(body.data.damageProbability >= 0 && body.data.damageProbability <= 1);
  assert.ok(['LOW', 'MEDIUM', 'HIGH'].includes(body.data.riskLevel));
  assert.equal(body.data.riskStatus, 'COMPLETED');

  // Verify SHAP Explanations
  assert.ok(body.data.shapExplanation, 'SHAP explanation must be present');
  assert.equal(body.data.shapExplanation.method, 'SHAP (TreeExplainer)');
  assert.ok(Array.isArray(body.data.shapExplanation.topContributors));
  assert.ok(body.data.shapExplanation.scientificDisclaimer.includes('not guaranteed causal'));

  // Verify Packaging Recommendations
  assert.ok(body.data.packagingRecommendation);
  assert.ok(body.data.packagingRecommendation.recommendedPackaging);
  assert.ok(body.data.packagingRecommendation.storageGuidance.length > 0);
  assert.ok(body.data.packagingRecommendation.handlingGuidance.length > 0);
  assert.ok(body.data.packagingRecommendation.transportationGuidance.length > 0);

  transportAssessmentId = body.data.assessmentId;
});

test('E2E 13: Component 4 — Standalone Smart Packaging Recommendations', async () => {
  const res = await fetch(`${BASE_URL}/transportation/recommend-packaging`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      crop: 'BLACK_PEPPER',
      distanceKm: 250,
      expectedDurationHours: 8,
      vehicleType: 'COVERED_TRUCK'
    })
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.data.cropType, 'BLACK_PEPPER');
  assert.ok(body.data.recommendedPackaging);
  assert.ok(body.data.storageGuidance.length > 0);
  assert.ok(body.data.supportingReferences.length > 0);
  assert.equal(body.data.reviewStatus, 'AGRONOMIC_STANDARD_GUIDELINE');
});

test('E2E 14: Historical Assessment Persistence in MongoDB', async () => {
  // C1 History
  const c1Res = await fetch(`${BASE_URL}/crops/history`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.equal(c1Res.status, 200);
  const c1Body = await c1Res.json();
  assert.ok(Array.isArray(c1Body.data.history || c1Body.data.items || c1Body.data));

  // C2 History
  const c2Res = await fetch(`${BASE_URL}/diseases/history`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.equal(c2Res.status, 200);
  const c2Body = await c2Res.json();
  assert.ok(Array.isArray(c2Body.data.history || c2Body.data.items || c2Body.data));

  // C4 History
  const c4Res = await fetch(`${BASE_URL}/transportation/history`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.equal(c4Res.status, 200);
  const c4Body = await c4Res.json();
  assert.ok(Array.isArray(c4Body.data.history || c4Body.data.items || c4Body.data));
});

test('E2E 15: Security & Error Handling Resilience', async () => {
  // Unauthorized request rejected
  const unauthRes = await fetch(`${BASE_URL}/farms`);
  assert.equal(unauthRes.status, 401);

  // Invalid login credentials rejected
  const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'WrongPassword999' })
  });
  assert.equal(badLoginRes.status, 401);

  // Invalid crop rejected by validation
  const badCropRes = await fetch(`${BASE_URL}/crops/recommend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`
    },
    body: JSON.stringify({
      district: 'Kandy',
      nitrogen: 50
    })
  });
  assert.equal(badCropRes.status, 400);
});

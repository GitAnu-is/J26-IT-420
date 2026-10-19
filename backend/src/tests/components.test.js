const request = require('supertest');
const app = require('../app');

describe('Research Components Isolation & Contracts (C1, C2, C4)', () => {
  // ===========================================================================
  // Component 1: Crop Recommendation & Harvest Planning
  // ===========================================================================
  describe('Component 1 (c1_crop_recommendation)', () => {
    it('1. GET /api/v1/crops returns C1 module specifications', async () => {
      const res = await request(app).get('/api/v1/crops');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.componentId).toBe('C1');
      expect(res.body.data.models.recommendation).toBe('Random Forest Classifier');
      expect(res.body.data.models.harvestPrediction).toBe('Random Forest Regressor');
    });

    it('2. POST /api/v1/crops/recommend rejects missing soil parameters with 400', async () => {
      const res = await request(app)
        .post('/api/v1/crops/recommend')
        .send({
          nitrogen: 50
          // missing phosphorus, potassium, ph
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details.length).toBeGreaterThanOrEqual(1);
    });

    it('3. POST /api/v1/crops/recommend with valid parameters delegates to adapter and returns explicit 501 (No fake predictions)', async () => {
      const res = await request(app)
        .post('/api/v1/crops/recommend')
        .send({
          nitrogen: 80,
          phosphorus: 45,
          potassium: 60,
          ph: 6.2,
          moisture: 70,
          district: 'Kurunegala'
        });

      expect(res.status).toBe(501);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
      expect(res.body.message).toContain('Component 1');
    });

    it('4. POST /api/v1/crops/predict-harvest rejects unsupported crop name with 400', async () => {
      const res = await request(app)
        .post('/api/v1/crops/predict-harvest')
        .send({
          crop: 'WATERMELON',
          plantingDate: '2026-05-01'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('5. POST /api/v1/crops/predict-harvest with supported crop returns explicit 501', async () => {
      const res = await request(app)
        .post('/api/v1/crops/predict-harvest')
        .send({
          crop: 'BANANA',
          plantingDate: '2026-05-01',
          district: 'Gampaha'
        });

      expect(res.status).toBe(501);
      expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
    });
  });

  // ===========================================================================
  // Component 2: Plant Disease Detection & Severity Assessment
  // ===========================================================================
  describe('Component 2 (c2_disease_detection)', () => {
    it('1. GET /api/v1/diseases returns C2 module specifications', async () => {
      const res = await request(app).get('/api/v1/diseases');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.componentId).toBe('C2');
      expect(res.body.data.models.detectionAndSeverity).toEqual(['EfficientNet-B0', 'ResNet50']);
      expect(res.body.data.severityLevels).toEqual(['Low', 'Medium', 'High']);
    });

    it('2. POST /api/v1/diseases/analyze rejects request without image or unsupported crop', async () => {
      const res = await request(app)
        .post('/api/v1/diseases/analyze')
        .send({
          crop: 'APPLE' // unsupported crop
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('3. POST /api/v1/diseases/analyze with valid payload delegates to adapter and returns explicit 501', async () => {
      const res = await request(app)
        .post('/api/v1/diseases/analyze')
        .send({
          crop: 'PINEAPPLE',
          imageUrl: 'https://example.com/pineapple_leaf_sample.jpg'
        });

      expect(res.status).toBe(501);
      expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
      expect(res.body.message).toContain('Component 2');
    });

    it('4. GET /api/v1/diseases/assessments/:id returns 404 for non-existent assessment', async () => {
      const res = await request(app).get('/api/v1/diseases/assessments/assessment-999');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  // ===========================================================================
  // Component 4: Transportation Risk & Smart Packaging
  // ===========================================================================
  describe('Component 4 (c4_transportation_risk)', () => {
    it('1. GET /api/v1/transportation returns C4 specifications and independence assertion', async () => {
      const res = await request(app).get('/api/v1/transportation');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.componentId).toBe('C4');
      expect(res.body.data.models.riskClassification).toContain('XGBoost');
      expect(res.body.data.models.explainability).toContain('SHAP');
      expect(res.body.data.independenceRule).toContain('Operates independently');
    });

    it('2. POST /api/v1/transportation/predict-risk rejects invalid vehicle or packaging type', async () => {
      const res = await request(app)
        .post('/api/v1/transportation/predict-risk')
        .send({
          crop: 'BLACK_PEPPER',
          distanceKm: 120,
          durationHours: 4,
          vehicleType: 'AIRPLANE', // invalid vehicle
          packagingType: 'PLASTIC_CRATES',
          roadCondition: 'PAVED_GOOD'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('3. POST /api/v1/transportation/predict-risk with valid data delegates to adapter and returns 501', async () => {
      const res = await request(app)
        .post('/api/v1/transportation/predict-risk')
        .send({
          crop: 'BLACK_PEPPER',
          distanceKm: 120,
          durationHours: 4,
          vehicleType: 'COVERED_TRUCK',
          packagingType: 'GUNNY_BAGS',
          roadCondition: 'PAVED_GOOD'
        });

      expect(res.status).toBe(501);
      expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
      expect(res.body.message).toContain('Component 4');
    });

    it('4. POST /api/v1/transportation/recommend-packaging with valid data delegates to adapter and returns 501', async () => {
      const res = await request(app)
        .post('/api/v1/transportation/recommend-packaging')
        .send({
          crop: 'BANANA',
          distanceKm: 250,
          vehicleType: 'REFRIGERATED_TRUCK'
        });

      expect(res.status).toBe(501);
      expect(res.body.error.code).toBe('NOT_IMPLEMENTED');
    });
  });

  // ===========================================================================
  // Strict Exclusion of Removed Component 3
  // ===========================================================================
  describe('Strict Exclusion of Removed Component 3', () => {
    it('1. Verifies no quality grading or market readiness endpoints exist', async () => {
      const res1 = await request(app).get('/api/v1/quality');
      expect(res1.status).toBe(404);

      const res2 = await request(app).get('/api/v1/grading');
      expect(res2.status).toBe(404);

      const res3 = await request(app).get('/api/v1/market-readiness');
      expect(res3.status).toBe(404);

      const res4 = await request(app).get('/api/v1/shelf-life');
      expect(res4.status).toBe(404);
    });
  });
});

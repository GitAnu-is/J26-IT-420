const request = require('supertest');
const app = require('../app');

describe('Health & Status Endpoints', () => {
  it('1. GET /api/v1/health returns HTTP 200 with complete system status', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');

    const data = res.body.data;
    expect(data.status).toBe('healthy');
    expect(typeof data.uptime).toBe('number');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('database');
    expect(data.database).toHaveProperty('status');
    expect(data).toHaveProperty('system');
    expect(data.system).toHaveProperty('memory');

    // Confirms exactly the 3 approved research components are active
    expect(data.activeComponents).toHaveProperty('c1_crop_recommendation');
    expect(data.activeComponents).toHaveProperty('c2_disease_detection');
    expect(data.activeComponents).toHaveProperty('c4_transportation_risk');
    expect(data.activeComponents).not.toHaveProperty('c3_quality_grading');
  });

  it('2. GET /health shortcut endpoint returns HTTP 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
  });
});

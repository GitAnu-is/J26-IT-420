const request = require('supertest');
const app = require('../app');

describe('API Foundation & Shared Infrastructure', () => {
  it('1. Express app can be imported without launching an HTTP listener', () => {
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });

  it('2. GET / returns platform information and supported crops', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.platform).toBe('AgriGuard');
    expect(res.body.data.researchGroup).toBe('J26-IT-420');
    expect(res.body.data.supportedCrops).toEqual(['BANANA', 'PINEAPPLE', 'BLACK_PEPPER']);
  });

  it('3. GET /api/v1 returns versioned API discovery information', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.researchComponents).toHaveLength(3);
    const componentIds = res.body.data.researchComponents.map((c) => c.id);
    expect(componentIds).toEqual(['C1', 'C2', 'C4']);
  });

  it('4. Unknown route returns standardized HTTP 404', async () => {
    const res = await request(app).get('/api/v1/non-existent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  it('5. Malformed JSON payload returns standardized HTTP 400 with MALFORMED_JSON code', async () => {
    const res = await request(app)
      .post('/api/v1/crops/recommend')
      .set('Content-Type', 'application/json')
      .send('{"bad-json": '); // intentionally invalid JSON syntax

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('MALFORMED_JSON');
    expect(res.body.message).toContain('Invalid JSON payload');
  });

  it('6. Phase 2 auth login endpoint rejects missing or invalid email with 400 VALIDATION_ERROR', async () => {
    const postRes = await request(app).post('/api/v1/auth/login').send({ username: 'test', password: 'secret' });
    expect(postRes.status).toBe(400);
    expect(postRes.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('7. Phase 2 users profile endpoint requires authentication and returns 401 UNAUTHORIZED', async () => {
    const getRes = await request(app).get('/api/v1/users/me');
    expect(getRes.status).toBe(401);
    expect(getRes.body.error.code).toBe('UNAUTHORIZED');
  });
});

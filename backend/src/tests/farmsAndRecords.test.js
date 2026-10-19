const request = require('supertest');
const app = require('../app');
const { ROLES } = require('../shared/constants/roles');
const { setupTestDb, clearTestDb, teardownTestDb, createTestUser } = require('./testHelper');

describe('Phase 2 — Farm Management & Agricultural Records', () => {
  let farmerA;
  let farmerB;
  let officerUser;

  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    farmerA = await createTestUser({ fullName: 'Farmer Kamal', role: ROLES.FARMER });
    farmerB = await createTestUser({ fullName: 'Farmer Nimal', role: ROLES.FARMER });
    officerUser = await createTestUser({ fullName: 'Officer Bandara', role: ROLES.AGRICULTURAL_OFFICER });
  });

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('User Profile Management (/api/v1/users/me)', () => {
    it('1. GET /api/v1/users/me returns profile for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${farmerA.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.profile.fullName).toBe('Farmer Kamal');
      expect(res.body.data.profile.role).toBe(ROLES.FARMER);
    });

    it('2. PATCH /api/v1/users/me allows updating fullName and phoneNumber', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${farmerA.accessToken}`)
        .send({
          fullName: 'Kamal Gunaratne',
          phoneNumber: '0719876543'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.profile.fullName).toBe('Kamal Gunaratne');
      expect(res.body.data.profile.phoneNumber).toBe('0719876543');
    });

    it('3. PATCH /api/v1/users/me rejects attempts to elevate role or change email with 400', async () => {
      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${farmerA.accessToken}`)
        .send({
          role: 'ADMIN',
          email: 'admin@hacker.com'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Farm Management (/api/v1/farms)', () => {
    it('1. POST /api/v1/farms creates a new farm linked to authenticated farmer', async () => {
      const res = await request(app)
        .post('/api/v1/farms')
        .set('Authorization', `Bearer ${farmerA.accessToken}`)
        .send({
          farmName: 'Test Farm Kurunegala',
          district: 'Kurunegala',
          agroEcologicalZone: 'IL1',
          area: 5.5,
          areaUnit: 'ACRES',
          supportedCrops: ['BANANA', 'PINEAPPLE'],
          locationCoordinates: {
            latitude: 7.4863,
            longitude: 80.3623
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.farm.farmName).toBe('Test Farm Kurunegala');
      expect(res.body.data.farm.ownerId).toBe(farmerA.user._id.toString());
      expect(res.body.data.farm.supportedCrops).toEqual(['BANANA', 'PINEAPPLE']);
    });

    it('2. GET /api/v1/farms lists only the authenticated farmer farms with pagination', async () => {
      // Farmer A creates 2 farms
      await request(app)
        .post('/api/v1/farms')
        .set('Authorization', `Bearer ${farmerA.accessToken}`)
        .send({ farmName: 'Test Farm A1', district: 'Gampaha', supportedCrops: ['PINEAPPLE'] });

      await request(app)
        .post('/api/v1/farms')
        .set('Authorization', `Bearer ${farmerA.accessToken}`)
        .send({ farmName: 'Test Farm A2', district: 'Kurunegala', supportedCrops: ['BANANA'] });

      // Farmer B creates 1 farm
      await request(app)
        .post('/api/v1/farms')
        .set('Authorization', `Bearer ${farmerB.accessToken}`)
        .send({ farmName: 'Test Farm B1', district: 'Kandy', supportedCrops: ['BLACK_PEPPER'] });

      // Farmer A queries farms
      const resA = await request(app)
        .get('/api/v1/farms')
        .set('Authorization', `Bearer ${farmerA.accessToken}`);

      expect(resA.status).toBe(200);
      expect(resA.body.data.farms.length).toBe(2);
      expect(resA.body.data.pagination.totalRecords).toBe(2);

      // Farmer B queries farms
      const resB = await request(app)
        .get('/api/v1/farms')
        .set('Authorization', `Bearer ${farmerB.accessToken}`);

      expect(resB.status).toBe(200);
      expect(resB.body.data.farms.length).toBe(1);
      expect(resB.body.data.farms[0].farmName).toBe('Test Farm B1');
    });

    it('3. CROSS-USER ISOLATION: Farmer B cannot access or update Farmer A farm record', async () => {
      const createRes = await request(app)
        .post('/api/v1/farms')
        .set('Authorization', `Bearer ${farmerA.accessToken}`)
        .send({ farmName: 'Test Farm Private A', district: 'Matale', supportedCrops: ['BLACK_PEPPER'] });

      const farmId = createRes.body.data.farm._id;

      // Farmer B tries to read Farmer A farm
      const readRes = await request(app)
        .get(`/api/v1/farms/${farmId}`)
        .set('Authorization', `Bearer ${farmerB.accessToken}`);

      expect(readRes.status).toBe(403);
      expect(readRes.body.error.code).toBe('FORBIDDEN');

      // Farmer B tries to update Farmer A farm
      const updateRes = await request(app)
        .patch(`/api/v1/farms/${farmId}`)
        .set('Authorization', `Bearer ${farmerB.accessToken}`)
        .send({ farmName: 'Hacked Farm Name' });

      expect(updateRes.status).toBe(403);
      expect(updateRes.body.error.code).toBe('FORBIDDEN');
    });

    it('4. DELETE /api/v1/farms/:id soft-deletes farm and omits it from active listing', async () => {
      const createRes = await request(app)
        .post('/api/v1/farms')
        .set('Authorization', `Bearer ${farmerA.accessToken}`)
        .send({ farmName: 'Test Farm To Delete', district: 'Kalutara' });

      const farmId = createRes.body.data.farm._id;

      const deleteRes = await request(app)
        .delete(`/api/v1/farms/${farmId}`)
        .set('Authorization', `Bearer ${farmerA.accessToken}`);

      expect(deleteRes.status).toBe(200);

      // Farm should no longer appear in active list
      const listRes = await request(app)
        .get('/api/v1/farms')
        .set('Authorization', `Bearer ${farmerA.accessToken}`);

      const found = listRes.body.data.farms.find((f) => f._id === farmId);
      expect(found).toBeUndefined();
    });

    it('5. Rejects invalid coordinates with 400', async () => {
      const res = await request(app)
        .post('/api/v1/farms')
        .set('Authorization', `Bearer ${farmerA.accessToken}`)
        .send({
          farmName: 'Test Farm Invalid Coordinates',
          district: 'Gampaha',
          locationCoordinates: {
            latitude: 150, // invalid latitude > 90
            longitude: 80.0
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Agricultural Record Management (/api/v1/agricultural-records)', () => {
    let farmA;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/v1/farms')
        .set('Authorization', `Bearer ${farmerA.accessToken}`)
        .send({
          farmName: 'Test Farm Agro Context',
          district: 'Gampaha',
          supportedCrops: ['PINEAPPLE']
        });
      farmA = res.body.data.farm;
    });

    it('1. POST /api/v1/agricultural-records creates record linked to farm', async () => {
      const res = await request(app)
        .post('/api/v1/agricultural-records')
        .set('Authorization', `Bearer ${farmerA.accessToken}`)
        .send({
          farmId: farmA._id,
          cropType: 'PINEAPPLE',
          plantingDate: '2026-03-01',
          expectedHarvestDate: '2027-08-01',
          soilPh: 5.5,
          nitrogen: 65,
          phosphorus: 40,
          potassium: 55,
          soilMoisture: 60,
          locationContext: 'Test Location Block 1',
          notes: 'Healthy saplings planted with organic compost'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.record.cropType).toBe('PINEAPPLE');
      expect(res.body.data.record.soilPh).toBe(5.5);
    });

    it('2. CROSS-FARM ISOLATION: Rejects creating record for another user farm with 403', async () => {
      const res = await request(app)
        .post('/api/v1/agricultural-records')
        .set('Authorization', `Bearer ${farmerB.accessToken}`) // Farmer B attempting to add record to Farmer A farm
        .send({
          farmId: farmA._id,
          cropType: 'PINEAPPLE',
          plantingDate: '2026-03-01'
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.message).toContain('only create agricultural records for farms you own');
    });

    it('3. Rejects expected harvest date earlier than planting date with 400', async () => {
      const res = await request(app)
        .post('/api/v1/agricultural-records')
        .set('Authorization', `Bearer ${farmerA.accessToken}`)
        .send({
          farmId: farmA._id,
          cropType: 'BANANA',
          plantingDate: '2026-05-01',
          expectedHarvestDate: '2026-01-01' // earlier than planting date!
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].message).toContain('earlier than planting date');
    });

    it('4. Rejects impossible soil pH values (< 3.0 or > 10.0)', async () => {
      const res = await request(app)
        .post('/api/v1/agricultural-records')
        .set('Authorization', `Bearer ${farmerA.accessToken}`)
        .send({
          farmId: farmA._id,
          cropType: 'BANANA',
          plantingDate: '2026-05-01',
          soilPh: 14.0 // impossible pH
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});

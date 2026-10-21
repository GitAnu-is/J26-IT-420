const request = require('supertest');
const app = require('../app');
const User = require('../shared/models/User');
const RefreshSession = require('../shared/models/RefreshSession');
const { ROLES } = require('../shared/constants/roles');
const { setupTestDb, clearTestDb, teardownTestDb, createTestUser } = require('./testHelper');

describe('Phase 2 — Authentication & Session Lifecycle', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('User Registration (POST /api/v1/auth/register)', () => {
    it('1. Successfully registers a new farmer account and returns safe user data and tokens', async () => {
      const email = `farmer_${Date.now()}@test.sliit.lk`;
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Sunil Perera',
          email,
          password: 'Password123!',
          phoneNumber: '0771234567',
          role: ROLES.FARMER
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user.email).toBe(email.toLowerCase());
      expect(res.body.data.user.role).toBe(ROLES.FARMER);
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('2. Rejects duplicate email registration with 409 Conflict', async () => {
      const email = `duplicate_${Date.now()}@test.sliit.lk`;
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'First Registrant',
          email,
          password: 'Password123!',
          role: ROLES.FARMER
        });

      const duplicateRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Second Registrant',
          email,
          password: 'Password123!',
          role: ROLES.FARMER
        });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.error.code).toBe('DUPLICATE_EMAIL');
      expect(duplicateRes.body.message).toContain('already exists');
    });

    it('3. Rejects weak password missing numbers or uppercase letters with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Weak Password User',
          email: `weak_${Date.now()}@test.sliit.lk`,
          password: 'weakpassword',
          role: ROLES.FARMER
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('4. Rejects self-registration with ADMIN role to prevent privilege escalation', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Attacker Attempting Admin',
          email: `admin_hack_${Date.now()}@test.sliit.lk`,
          password: 'Password123!',
          role: 'ADMIN'
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.message).toContain('Request validation failed');
    });

    it('5. Successfully stores hashed password in database, never plain text', async () => {
      const plainPassword = 'SuperSecret123!';
      const email = `hashcheck_${Date.now()}@test.sliit.lk`;

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Hash Check User',
          email,
          password: plainPassword,
          role: ROLES.FARMER
        });

      const user = await User.findOne({ email }).select('+passwordHash');
      expect(user).toBeDefined();
      expect(user.passwordHash).not.toBe(plainPassword);
      expect(user.passwordHash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format
    });
  });

  describe('User Login (POST /api/v1/auth/login)', () => {
    it('1. Successfully logs in with valid credentials and updates lastLoginAt', async () => {
      const email = `login_${Date.now()}@test.sliit.lk`;
      const password = 'Password123!';

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Login Test User',
          email,
          password,
          role: ROLES.FARMER
        });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data).toHaveProperty('accessToken');
      expect(loginRes.body.data).toHaveProperty('refreshToken');

      const userInDb = await User.findOne({ email });
      expect(userInDb.lastLoginAt).not.toBeNull();
    });

    it('2. Rejects incorrect password with generic 401 INVALID_CREDENTIALS error', async () => {
      const email = `wrongpass_${Date.now()}@test.sliit.lk`;
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'User Name',
          email,
          password: 'Password123!',
          role: ROLES.FARMER
        });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'WrongPassword123!' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('3. Rejects non-existent email with generic 401 error to prevent enumeration', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@test.sliit.lk', password: 'Password123!' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('4. Rejects deactivated account login', async () => {
      const { user, rawPassword } = await createTestUser();
      user.isActive = false;
      await user.save();

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: rawPassword });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('ACCOUNT_INACTIVE');
    });
  });

  describe('Refresh Token Rotation & Replay Protection (POST /api/v1/auth/refresh)', () => {
    it('1. Successfully rotates refresh token and invalidates the previous token', async () => {
      const { refreshToken: oldRefreshToken } = await createTestUser();

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');

      const newRefreshToken = res.body.data.refreshToken;
      expect(newRefreshToken).not.toBe(oldRefreshToken);

      // Verify old session is now marked revoked in the database
      const oldSessionId = oldRefreshToken.split('.')[0];
      const oldSession = await RefreshSession.findById(oldSessionId);
      expect(oldSession.isRevoked).toBe(true);
      expect(oldSession.revokedAt).not.toBeNull();
    });

    it('2. REPLAY DETECTION: Attempting to reuse an already rotated token triggers family revocation', async () => {
      const { refreshToken: originalToken } = await createTestUser();

      // First rotation succeeds
      const firstRotation = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: originalToken });
      expect(firstRotation.status).toBe(200);

      // Malicious replay attempt: reusing the old token
      const replayRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: originalToken });

      expect(replayRes.status).toBe(401);
      expect(replayRes.body.error.code).toBe('TOKEN_REUSE_DETECTED');

      // The new replacement token should also now be revoked due to family revocation!
      const replacementToken = firstRotation.body.data.refreshToken;
      const secondAttempt = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: replacementToken });

      expect(secondAttempt.status).toBe(401);
      expect(secondAttempt.body.error.code).toBe('TOKEN_REUSE_DETECTED');
    });

    it('3. Rejects expired refresh tokens with 401 TOKEN_EXPIRED', async () => {
      const { refreshToken } = await createTestUser();
      const sessionId = refreshToken.split('.')[0];

      // Artificially expire session
      await RefreshSession.findByIdAndUpdate(sessionId, {
        expiresAt: new Date(Date.now() - 10000)
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('Session Termination: Logout & Logout-All', () => {
    it('1. POST /api/v1/auth/logout invalidates the specific refresh session', async () => {
      const { refreshToken } = await createTestUser();

      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken });

      expect(logoutRes.status).toBe(200);

      // Subsequent refresh with that token fails
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(401);
    });

    it('2. POST /api/v1/auth/logout-all terminates all active sessions for authenticated user', async () => {
      const { user, accessToken } = await createTestUser();

      // Create a second session
      const tokenService = require('../shared/services/tokenService');
      const { refreshToken: secondRefreshToken } = await tokenService.createRefreshSession(user);

      const logoutAllRes = await request(app)
        .post('/api/v1/auth/logout-all')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(logoutAllRes.status).toBe(200);

      // Both refresh sessions must now be revoked
      const activeSessions = await RefreshSession.find({ userId: user._id, isRevoked: false });
      expect(activeSessions.length).toBe(0);

      // Attempting to refresh with second token must now fail
      const tryRefresh = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: secondRefreshToken });

      expect(tryRefresh.status).toBe(401);
    });
  });

  describe('Password Change (POST /api/v1/auth/change-password)', () => {
    it('1. Changes password, updates passwordChangedAt, and invalidates older sessions', async () => {
      const { user, accessToken, rawPassword, refreshToken } = await createTestUser();
      const newPassword = 'NewSecurePassword456!';

      const changeRes = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: rawPassword,
          newPassword
        });

      expect(changeRes.status).toBe(200);

      // Old refresh session must be revoked
      const refreshAttempt = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });
      expect(refreshAttempt.status).toBe(401);

      // Login with old password fails
      const oldLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: rawPassword });
      expect(oldLogin.status).toBe(401);

      // Login with new password succeeds
      const newLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: newPassword });
      expect(newLogin.status).toBe(200);
    });
  });

  describe('Safe Profile Retrieval (GET /api/v1/auth/me)', () => {
    it('1. Returns authenticated user profile without exposing sensitive password hash', async () => {
      const { user, accessToken } = await createTestUser();

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe(user.email);
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
      expect(res.body.data.user).not.toHaveProperty('__v');
    });
  });
});

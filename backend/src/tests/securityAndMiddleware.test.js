const request = require('supertest');
const express = require('express');
const cors = require('cors');
const { corsOptions } = require('../config/cors');
const { authenticate, optionalAuthenticate } = require('../shared/middleware/authMiddleware');
const { errorHandler } = require('../shared/middleware/errorHandler');
const { BadRequestError, DatabaseError, ForbiddenError } = require('../shared/errors/AppError');
const { getDatabaseStatus } = require('../config/database');

describe('Security, CORS, Auth Foundation & Database Status', () => {
  describe('CORS Configuration', () => {
    let corsApp;

    beforeAll(() => {
      corsApp = express();
      corsApp.use(cors(corsOptions));
      corsApp.get('/test-cors', (req, res) => res.json({ ok: true }));
      corsApp.use(errorHandler);
    });

    it('1. Allows requests without an Origin header (Mobile Flutter / Dart HTTP client, cURL)', async () => {
      const res = await request(corsApp).get('/test-cors');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('2. Allows requests with an allowed web origin (e.g., http://localhost:5173)', async () => {
      const res = await request(corsApp)
        .get('/test-cors')
        .set('Origin', 'http://localhost:5173');
      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('3. Rejects requests from unauthorized origins with standard 403 Forbidden', async () => {
      const res = await request(corsApp)
        .get('/test-cors')
        .set('Origin', 'http://malicious-website.com');
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Auth Middleware Foundation', () => {
    let authApp;

    beforeAll(() => {
      authApp = express();
      authApp.use(express.json());

      authApp.get('/protected', authenticate, (req, res) => {
        res.json({ success: true, token: req.token });
      });

      authApp.get('/optional', optionalAuthenticate, (req, res) => {
        res.json({ success: true, token: req.token || null });
      });

      authApp.use(errorHandler);
    });

    it('1. Rejects request when Authorization header is completely absent', async () => {
      const res = await request(authApp).get('/protected');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('2. Rejects request when Authorization header does not use Bearer format', async () => {
      const res = await request(authApp)
        .get('/protected')
        .set('Authorization', 'Basic dXNlcjpwYXNz');
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid authorization format');
    });

    it('3. Rejects request when Bearer token is whitespace', async () => {
      const res = await request(authApp)
        .get('/protected')
        .set('Authorization', 'Bearer ');
      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Bearer token is empty');
    });

    it('4. Rejects request when Bearer token has invalid signature or malformed JWT', async () => {
      const res = await request(authApp)
        .get('/protected')
        .set('Authorization', 'Bearer sample_invalid_jwt_token_123');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_INVALID');
    });

    it('5. Optional auth passes through without token if not provided', async () => {
      const res = await request(authApp).get('/optional');
      expect(res.status).toBe(200);
      expect(res.body.token).toBeNull();
    });
  });

  describe('Error Handler Edge Cases & Database State', () => {
    let errApp;

    beforeAll(() => {
      errApp = express();
      errApp.use(express.json());

      errApp.get('/trigger-cast-error', (req, res, next) => {
        const castError = new Error('Cast to ObjectId failed');
        castError.name = 'CastError';
        castError.path = '_id';
        castError.value = 'invalid-mongo-id';
        next(castError);
      });

      errApp.get('/trigger-db-validation-error', (req, res, next) => {
        const valError = new Error('Validation failed');
        valError.name = 'ValidationError';
        valError.errors = {
          crop: { path: 'crop', message: 'Crop is required' }
        };
        next(valError);
      });

      errApp.get('/trigger-generic-error', (req, res, next) => {
        next(new Error('Internal unexpected crash'));
      });

      errApp.use(errorHandler);
    });

    it('1. Handles Mongoose CastError with 400 and structured details', async () => {
      const res = await request(errApp).get('/trigger-cast-error');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].field).toBe('_id');
    });

    it('2. Handles Mongoose ValidationError with 400 and structured details', async () => {
      const res = await request(errApp).get('/trigger-db-validation-error');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details[0].field).toBe('crop');
    });

    it('3. Handles unhandled generic errors with 500 without leaking sensitive data', async () => {
      const res = await request(errApp).get('/trigger-generic-error');
      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('4. getDatabaseStatus returns object containing connection state', () => {
      const status = getDatabaseStatus();
      expect(status).toHaveProperty('state');
      expect(status).toHaveProperty('readyState');
      expect(status).toHaveProperty('isConnected');
    });
  });
});

const { validateEnv } = require('../config/env');

describe('Configuration & Environment Validation', () => {
  const validBaseEnv = {
    NODE_ENV: 'test',
    PORT: '5000',
    HOST: '0.0.0.0',
    MONGODB_URI: 'mongodb://127.0.0.1:27017/agriguard_test',
    CORS_ORIGINS: 'http://localhost:5173,http://localhost:3000',
    LOG_LEVEL: 'info',
    JWT_ACCESS_SECRET: 'test_access_secret_with_minimum_32_characters_123',
    JWT_REFRESH_SECRET: 'test_refresh_secret_with_minimum_32_characters_123'
  };

  it('1. Successfully validates complete and correct environment settings', () => {
    const validated = validateEnv(validBaseEnv);
    expect(validated.NODE_ENV).toBe('test');
    expect(validated.PORT).toBe(5000);
    expect(validated.HOST).toBe('0.0.0.0');
    expect(validated.MONGODB_URI).toBe('mongodb://127.0.0.1:27017/agriguard_test');
    expect(validated.ALLOWED_ORIGINS).toEqual(['http://localhost:5173', 'http://localhost:3000']);
    expect(validated.JWT_ACCESS_SECRET).toBe('test_access_secret_with_minimum_32_characters_123');
  });

  it('2. Rejects environment when MONGODB_URI is missing or empty', () => {
    const invalidEnv = { ...validBaseEnv, MONGODB_URI: '' };
    expect(() => validateEnv(invalidEnv)).toThrow(/Environment validation error.*MONGODB_URI/);
  });

  it('3. Rejects invalid port numbers outside 1-65535 range', () => {
    const invalidEnv = { ...validBaseEnv, PORT: '99999' };
    expect(() => validateEnv(invalidEnv)).toThrow(/Environment validation error.*PORT/);
  });

  it('4. Rejects unrecognized NODE_ENV values', () => {
    const invalidEnv = { ...validBaseEnv, NODE_ENV: 'staging' };
    expect(() => validateEnv(invalidEnv)).toThrow(/Environment validation error.*NODE_ENV/);
  });

  it('5. Rejects JWT_ACCESS_SECRET if shorter than 32 characters', () => {
    const invalidEnv = { ...validBaseEnv, JWT_ACCESS_SECRET: 'too_short_secret' };
    expect(() => validateEnv(invalidEnv)).toThrow(/Environment validation error.*JWT_ACCESS_SECRET/);
  });

  it('6. Correctly parses single or comma-separated CORS origins into an array', () => {
    const customEnv = {
      ...validBaseEnv,
      CORS_ORIGINS: 'http://localhost:5173, https://agriguard.sliit.lk, http://10.0.2.2:5000'
    };
    const validated = validateEnv(customEnv);
    expect(validated.ALLOWED_ORIGINS).toEqual([
      'http://localhost:5173',
      'https://agriguard.sliit.lk',
      'http://10.0.2.2:5000'
    ]);
  });
});

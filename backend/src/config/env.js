const dotenv = require('dotenv');
const { z } = require('zod');

// Preserve test NODE_ENV if running under Jest
const initialNodeEnv = process.env.NODE_ENV;
dotenv.config({ override: true });
if (initialNodeEnv === 'test') {
  process.env.NODE_ENV = 'test';
}

/**
 * Zod schema for environment variable validation
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  HOST: z.string().default('0.0.0.0'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  BODY_LIMIT: z.string().default('10mb'),
  API_PREFIX: z.string().default('/api/v1'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters long'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long'),
  JWT_ISSUER: z.string().default('agriguard'),
  JWT_AUDIENCE: z.string().default('agriguard-clients'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(16).default(12),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  C1_PYTHON_SERVICE_URL: z.string().url().optional().or(z.literal('')).default(''),
  C1_PYTHON_SERVICE_KEY: z.string().optional().default(''),
  C1_INFERENCE_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  OPENWEATHER_API_KEY: z.string().optional().default(''),
  OPENWEATHER_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  C2_PYTHON_SERVICE_URL: z.string().url().optional().or(z.literal('')).default(''),
  C2_PYTHON_SERVICE_KEY: z.string().optional().default(''),
  C2_INFERENCE_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  C2_STORAGE_PATH: z.string().optional().default('uploads/diseases'),
  C4_PYTHON_SERVICE_URL: z.string().url().optional().or(z.literal('')).default(''),
  C4_PYTHON_SERVICE_KEY: z.string().optional().default(''),
  C4_INFERENCE_TIMEOUT_MS: z.coerce.number().int().positive().default(15000)
});

/**
 * Validate given environment variables object
 * @param {Record<string, any>} rawEnv
 * @returns {object} Validated environment variables
 */
function validateEnv(rawEnv = process.env) {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Environment validation error: ${errorDetails}`);
  }

  const parsed = result.data;

  // Transform comma-separated CORS_ORIGINS into an array
  const allowedOrigins = parsed.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    ...parsed,
    ALLOWED_ORIGINS: allowedOrigins
  };
}

// In test environment, ensure test isolation with agriguard_test database and safe test secrets
const sourceEnv = { ...process.env };
if (sourceEnv.NODE_ENV === 'test') {
  if (sourceEnv.MONGODB_URI) {
    sourceEnv.MONGODB_URI = sourceEnv.MONGODB_URI.replace(/\/agriguard(\?|$)/, '/agriguard_test$1');
  } else {
    sourceEnv.MONGODB_URI = 'mongodb://127.0.0.1:27017/agriguard_test';
  }
  if (!sourceEnv.JWT_ACCESS_SECRET) {
    sourceEnv.JWT_ACCESS_SECRET = 'test_jwt_access_secret_key_at_least_32_characters_long_12345';
  }
  if (!sourceEnv.JWT_REFRESH_SECRET) {
    sourceEnv.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_key_at_least_32_characters_long_12345';
  }
  if (!sourceEnv.BCRYPT_SALT_ROUNDS) {
    sourceEnv.BCRYPT_SALT_ROUNDS = '10';
  }
}

let env;
try {
  env = validateEnv(sourceEnv);
} catch (error) {
  // eslint-disable-next-line no-console
  console.error('CRITICAL: Environment validation failed:');
  // eslint-disable-next-line no-console
  console.error(error.message);
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
  throw error;
}

module.exports = {
  env,
  validateEnv,
  envSchema
};

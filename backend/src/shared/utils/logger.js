const pino = require('pino');
const { env } = require('../../config/env');

const isDev = env.NODE_ENV === 'development';
const isTest = env.NODE_ENV === 'test';

const pinoConfig = {
  level: isTest ? 'silent' : env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      'token',
      '*.token',
      'secret',
      '*.secret',
      'apiKey',
      '*.apiKey',
      'db_password'
    ],
    censor: '[REDACTED]'
  },
  timestamp: pino.stdTimeFunctions.isoTime
};

let logger;

if (isDev) {
  logger = pino({
    ...pinoConfig,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    }
  });
} else {
  logger = pino(pinoConfig);
}

module.exports = {
  logger
};

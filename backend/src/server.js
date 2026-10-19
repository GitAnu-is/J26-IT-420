const app = require('./app');
const { env } = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { logger } = require('./shared/utils/logger');

let server;

/**
 * Start the HTTP server and establish database connection
 */
async function startServer() {
  try {
    // Attempt database connection
    try {
      await connectDatabase();
    } catch (dbError) {
      logger.warn(
        { err: dbError.message },
        'Application starting without persistent database connection (will retry or serve available routes).'
      );
    }

    server = app.listen(env.PORT, env.HOST, () => {
      logger.info(
        {
          port: env.PORT,
          host: env.HOST,
          env: env.NODE_ENV,
          apiPrefix: env.API_PREFIX
        },
        `AgriGuard Backend Server listening at http://${env.HOST}:${env.PORT}`
      );
      logger.info(`Health check available at http://${env.HOST}:${env.PORT}/api/v1/health`);
    });
  } catch (error) {
    logger.fatal({ err: error.message }, 'Failed to start AgriGuard application server.');
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 * @param {string} signal
 */
async function gracefulShutdown(signal) {
  logger.info({ signal }, 'Graceful shutdown signal received. Closing HTTP server and database connections...');

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed successfully.');
      try {
        await disconnectDatabase();
        logger.info('Database disconnected. AgriGuard backend process exiting cleanly.');
        process.exit(0);
      } catch (err) {
        logger.error({ err: err.message }, 'Error during database disconnection during shutdown.');
        process.exit(1);
      }
    });

    // Force close after 10 seconds if hanging
    setTimeout(() => {
      logger.error('Graceful shutdown timed out after 10s. Forcing exit.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

// Process lifecycle event listeners
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason: reason?.message || reason, stack: reason?.stack }, 'Unhandled Promise Rejection detected');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error.message, stack: error.stack }, 'Uncaught Exception detected');
  process.exit(1);
});

// Start server if executed directly
if (require.main === module) {
  startServer();
}

module.exports = {
  startServer,
  gracefulShutdown
};

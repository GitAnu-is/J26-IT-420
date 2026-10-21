const mongoose = require('mongoose');
const { env } = require('./env');
const { logger } = require('../shared/utils/logger');

let isConnected = false;

/**
 * Map mongoose connection readyState to human-readable string
 * 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
function getDatabaseStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const readyState = mongoose.connection.readyState;
  return {
    state: states[readyState] || 'unknown',
    readyState,
    isConnected: readyState === 1
  };
}

/**
 * Establish connection to MongoDB using Mongoose
 * Prevents duplicate connections and handles connection lifecycle events.
 * @returns {Promise<typeof mongoose>}
 */
async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    logger.debug('MongoDB is already connected. Reusing existing connection.');
    return mongoose;
  }

  if (mongoose.connection.readyState === 2) {
    logger.debug('MongoDB connection is already in progress. Awaiting establishment.');
    await new Promise((resolve) => mongoose.connection.once('connected', resolve));
    return mongoose;
  }

  const uri = env.MONGODB_URI;

  // Mask credentials for safe logging
  const maskedUri = uri.replace(/\/\/(.*):(.*)@/, '//***:***@');
  logger.info({ uri: maskedUri }, 'Connecting to MongoDB database...');

  try {
    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: env.NODE_ENV !== 'production'
    });

    isConnected = true;
    logger.info('MongoDB database connection established successfully.');

    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      logger.error({ err: err.message }, 'MongoDB connection encountered an error.');
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB disconnected.');
    });

    return connection;
  } catch (error) {
    isConnected = false;
    logger.error({ err: error.message }, 'Failed to connect to MongoDB database.');
    throw error;
  }
}

/**
 * Gracefully close MongoDB connection
 * @returns {Promise<void>}
 */
async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
      isConnected = false;
      logger.info('MongoDB connection closed gracefully.');
    } catch (err) {
      logger.error({ err: err.message }, 'Error during MongoDB disconnect.');
      throw err;
    }
  }
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
  getDatabaseStatus
};

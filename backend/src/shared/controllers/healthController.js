const { sendSuccess } = require('../utils/apiResponse');
const { getDatabaseStatus } = require('../../config/database');
const { env } = require('../../config/env');

const startTime = Date.now();

/**
 * Bounded non-blocking check to internal microservice health endpoint
 * @param {string} url
 * @param {number} timeoutMs
 * @returns {Promise<{ status: string, ready: boolean, details?: object }>}
 */
async function checkServiceHealth(url, timeoutMs = 500) {
  if (env.NODE_ENV === 'test') {
    return { status: 'initialized', ready: true };
  }
  if (!url) {
    return { status: 'unconfigured', ready: false };
  }
  try {
    const res = await fetch(`${url}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (res.ok) {
      const data = await res.json();
      return { status: 'ready', ready: true, details: data };
    }
    return { status: 'degraded', ready: false, httpStatus: res.status };
  } catch (_) {
    return { status: 'offline', ready: false };
  }
}

/**
 * Comprehensive health check handler returning runtime status, database connectivity, and component health
 */
async function getHealth(req, res) {
  const dbStatus = getDatabaseStatus();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  const memoryUsage = process.memoryUsage();

  // Non-blocking bounded checks for optional research AI microservices
  const [c1Check, c2Check, c4Check] = await Promise.all([
    checkServiceHealth(env.C1_PYTHON_SERVICE_URL, 400),
    checkServiceHealth(env.C2_PYTHON_SERVICE_URL, 400),
    checkServiceHealth(env.C4_PYTHON_SERVICE_URL, 400)
  ]);

  const allAisOnline = c1Check.ready && c2Check.ready && c4Check.ready;
  const isHealthy = dbStatus.isConnected || env.NODE_ENV === 'test';

  const healthData = {
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'AgriGuard Integrated Express Backend',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: uptimeSeconds,
    database: {
      status: dbStatus.state,
      connected: dbStatus.isConnected
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
        heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100
      }
    },
    inferenceServicesSummary: {
      overallInferenceStatus: allAisOnline ? 'OPTIMAL' : 'PARTIAL_OR_OFFLINE',
      c1Ready: c1Check.ready,
      c2Ready: c2Check.ready,
      c4Ready: c4Check.ready
    },
    activeComponents: {
      c1_crop_recommendation: {
        status: c1Check.ready ? 'ready' : (env.NODE_ENV === 'test' ? 'initialized' : c1Check.status),
        readiness: c1Check.ready ? 'READY' : (c1Check.status === 'unconfigured' ? 'UNCONFIGURED' : 'OFFLINE'),
        serviceConfigured: Boolean(env.C1_PYTHON_SERVICE_URL),
        description: 'AI-Based Crop Recommendation and Harvest Planning'
      },
      c2_disease_detection: {
        status: c2Check.ready ? 'ready' : (env.NODE_ENV === 'test' ? 'initialized' : c2Check.status),
        readiness: c2Check.ready ? 'READY' : (c2Check.status === 'unconfigured' ? 'UNCONFIGURED' : 'OFFLINE'),
        serviceConfigured: Boolean(env.C2_PYTHON_SERVICE_URL),
        description: 'AI-Based Plant Disease Detection and Severity Assessment'
      },
      c4_transportation_risk: {
        status: c4Check.ready ? 'ready' : (env.NODE_ENV === 'test' ? 'initialized' : c4Check.status),
        readiness: c4Check.ready ? 'READY' : (c4Check.status === 'unconfigured' ? 'UNCONFIGURED' : 'OFFLINE'),
        serviceConfigured: Boolean(env.C4_PYTHON_SERVICE_URL),
        description: 'AI-Based Transportation Risk Prediction and Smart Packaging'
      }
    }
  };

  return sendSuccess(res, {
    message: isHealthy
      ? 'AgriGuard backend service is operating normally'
      : 'AgriGuard backend service is operating in degraded mode',
    data: healthData
  });
}

/**
 * Lightweight liveness probe (for Kubernetes / systemd / load balancers)
 */
function getLiveness(req, res) {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  return sendSuccess(res, {
    message: 'AgriGuard backend process is alive',
    data: {
      status: 'alive',
      uptime: uptimeSeconds,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Lightweight readiness probe
 */
function getReadiness(req, res) {
  const dbStatus = getDatabaseStatus();
  const isReady = dbStatus.isConnected || env.NODE_ENV === 'test';

  if (!isReady && env.NODE_ENV === 'production') {
    return res.status(503).json({
      success: false,
      message: 'AgriGuard backend is not ready to accept traffic: database disconnected',
      data: {
        status: 'unready',
        database: dbStatus.state,
        timestamp: new Date().toISOString()
      }
    });
  }

  return sendSuccess(res, {
    message: 'AgriGuard backend is ready to accept requests',
    data: {
      status: 'ready',
      database: dbStatus.state,
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = {
  getHealth,
  getLiveness,
  getReadiness
};

const { Router } = require('express');
const { getHealth, getLiveness, getReadiness } = require('../controllers/healthController');

const router = Router();

// GET /api/v1/health and GET /health
router.get('/', getHealth);

// GET /api/v1/health/live and GET /health/live (Liveness probe)
router.get('/live', getLiveness);

// GET /api/v1/health/ready and GET /health/ready (Readiness probe)
router.get('/ready', getReadiness);

module.exports = router;

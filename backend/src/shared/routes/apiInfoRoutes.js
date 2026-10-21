const { Router } = require('express');
const { sendSuccess } = require('../utils/apiResponse');
const { SUPPORTED_CROP_LIST } = require('../constants/crops');

const router = Router();

const { RESEARCH_PROVENANCE } = require('../constants/modelProvenance');

// GET / and GET /api/v1
router.get('/', (req, res) => {
  return sendSuccess(res, {
    message: 'Welcome to the AgriGuard REST API - Smart Agriculture Decision Support Platform',
    data: {
      platform: 'AgriGuard',
      researchGroup: 'J26-IT-420',
      university: 'Sri Lanka Institute of Information Technology (SLIIT)',
      version: '1.0.0',
      phase: 'Phase 6 - Complete Backend Integration, Security Hardening and Research Validation',
      supportedCrops: SUPPORTED_CROP_LIST,
      documentation: '/docs',
      researchComponents: [
        {
          id: 'C1',
          code: 'c1_crop_recommendation',
          title: 'AI-Based Crop Recommendation and Harvest Planning System',
          baseRoute: '/api/v1/crops',
          models: ['Random Forest Classifier', 'Random Forest Regressor']
        },
        {
          id: 'C2',
          code: 'c2_disease_detection',
          title: 'AI-Based Plant Disease Detection and Severity Assessment System',
          baseRoute: '/api/v1/diseases',
          models: ['EfficientNet-B0', 'ResNet50', 'Grad-CAM']
        },
        {
          id: 'C4',
          code: 'c4_transportation_risk',
          title: 'AI-Based Transportation Risk Prediction and Smart Packaging Recommendation System',
          baseRoute: '/api/v1/transportation',
          models: ['Random Forest', 'XGBoost', 'CatBoost', 'Gradient Boosting', 'SHAP']
        }
      ],
      endpoints: {
        health: '/api/v1/health',
        provenance: '/api/v1/provenance',
        crops: '/api/v1/crops',
        diseases: '/api/v1/diseases',
        transportation: '/api/v1/transportation',
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        farms: '/api/v1/farms',
        farmOverview: '/api/v1/farms/:id/overview',
        agriculturalRecords: '/api/v1/agricultural-records'
      }
    }
  });
});

// GET /provenance and GET /api/v1/provenance
router.get('/provenance', (req, res) => {
  return sendSuccess(res, {
    message: 'AgriGuard Research Models Provenance, Datasets & Validation Contracts',
    data: {
      researchGroup: 'J26-IT-420 - SLIIT',
      components: RESEARCH_PROVENANCE
    }
  });
});

// GET /docs and GET /api/v1/docs - Serve OpenAPI 3 specification
const path = require('path');
const fs = require('fs');

let cachedSpec = null;
function loadSpec() {
  if (!cachedSpec) {
    const specPath = path.resolve(__dirname, '../../../docs/openapi.json');
    if (fs.existsSync(specPath)) {
      cachedSpec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    }
  }
  return cachedSpec;
}

router.get('/docs', (req, res) => {
  const spec = loadSpec();
  if (spec) {
    return res.json(spec);
  }
  return sendSuccess(res, {
    message: 'AgriGuard REST API documentation',
    data: { openapi: '3.0.3', endpoints: '/api/v1' }
  });
});

router.get('/docs/openapi.json', (req, res) => {
  const spec = loadSpec();
  if (spec) {
    return res.json(spec);
  }
  return res.status(404).json({ success: false, message: 'OpenAPI specification not found' });
});

module.exports = router;

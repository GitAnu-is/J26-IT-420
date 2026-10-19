const { Router } = require('express');
const controller = require('../controllers/transportationRiskController');
const { validate } = require('../../../shared/middleware/validate');
const { optionalAuthenticate } = require('../../../shared/middleware/authenticate');
const {
  predictTransportationRiskSchema,
  recommendPackagingSchema,
  assessmentIdSchema
} = require('../validators/transportationRiskValidator');

const router = Router();
router.use(optionalAuthenticate);

// GET /api/v1/transportation - Informational endpoint
router.get('/', (req, res, next) => controller.getComponentInfo(req, res, next));

// POST /api/v1/transportation/predict-risk - Predict risk of damage during transport
router.post('/predict-risk', validate({ body: predictTransportationRiskSchema }), (req, res, next) =>
  controller.predictRisk(req, res, next)
);

// POST /api/v1/transportation/recommend-packaging - Smart packaging recommendations
router.post('/recommend-packaging', validate({ body: recommendPackagingSchema }), (req, res, next) =>
  controller.recommendPackaging(req, res, next)
);

// GET /api/v1/transportation/history - History of transport assessments
router.get('/history', (req, res, next) => controller.getHistory(req, res, next));

// GET /api/v1/transportation/assessments/:id - Retrieve specific transport assessment
router.get(
  '/assessments/:id',
  validate({ params: assessmentIdSchema }),
  (req, res, next) => controller.getAssessmentById(req, res, next)
);

module.exports = router;

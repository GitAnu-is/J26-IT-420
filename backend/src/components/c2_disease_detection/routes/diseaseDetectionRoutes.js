const { Router } = require('express');
const controller = require('../controllers/diseaseDetectionController');
const { validate } = require('../../../shared/middleware/validate');
const { optionalAuthenticate } = require('../../../shared/middleware/authenticate');
const { handleImageUpload } = require('../middleware/uploadMiddleware');
const { analyzeDiseaseSchema, assessmentIdSchema } = require('../validators/diseaseDetectionValidator');

const router = Router();
router.use(optionalAuthenticate);

// GET /api/v1/diseases - Informational endpoint
router.get('/', (req, res, next) => controller.getComponentInfo(req, res, next));

// POST /api/v1/diseases/analyze - Analyze crop image for disease and severity (supports multipart and json)
router.post(
  '/analyze',
  handleImageUpload,
  validate({ body: analyzeDiseaseSchema }),
  (req, res, next) => controller.analyze(req, res, next)
);

// GET /api/v1/diseases/history - Assessment history for authenticated farmer
router.get('/history', (req, res, next) => controller.getHistory(req, res, next));

// GET /api/v1/diseases/assessments/:id - Get specific assessment
router.get(
  '/assessments/:id',
  validate({ params: assessmentIdSchema }),
  (req, res, next) => controller.getAssessmentById(req, res, next)
);

// GET /api/v1/diseases/assessments/:id/gradcam - Retrieve Grad-CAM overlay artifact image
router.get(
  '/assessments/:id/gradcam',
  validate({ params: assessmentIdSchema }),
  (req, res, next) => controller.getGradCamArtifact(req, res, next)
);

// GET /api/v1/diseases/assessments/:id/image - Retrieve original plant image artifact
router.get(
  '/assessments/:id/image',
  validate({ params: assessmentIdSchema }),
  (req, res, next) => controller.getOriginalImageArtifact(req, res, next)
);

module.exports = router;

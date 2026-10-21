const { Router } = require('express');
const controller = require('../controllers/cropRecommendationController');
const { validate } = require('../../../shared/middleware/validate');
const { optionalAuthenticate } = require('../../../shared/middleware/authenticate');
const { recommendCropSchema, predictHarvestSchema } = require('../validators/cropRecommendationValidator');

const router = Router();
router.use(optionalAuthenticate);

// GET /api/v1/crops - Informational endpoint
router.get('/', (req, res, next) => controller.getComponentInfo(req, res, next));

// POST /api/v1/crops/recommend - Recommend crop based on soil and weather
router.post('/recommend', validate({ body: recommendCropSchema }), (req, res, next) =>
  controller.recommendCrop(req, res, next)
);

// POST /api/v1/crops/predict-harvest - Predict harvest window
router.post('/predict-harvest', validate({ body: predictHarvestSchema }), (req, res, next) =>
  controller.predictHarvest(req, res, next)
);

// GET /api/v1/crops/history - History of recommendations
router.get('/history', (req, res, next) => controller.getHistory(req, res, next));

module.exports = router;

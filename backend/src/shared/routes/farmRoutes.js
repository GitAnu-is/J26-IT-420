const { Router } = require('express');
const controller = require('../controllers/farmController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { ROLES } = require('../constants/roles');
const {
  createFarmSchema,
  updateFarmSchema,
  farmIdParamSchema
} = require('../validators/farmValidator');

const router = Router();

// All farm management endpoints require authentication
router.use(authenticate);

// POST /api/v1/farms - Create farm (FARMER or ADMIN)
router.post(
  '/',
  authorize(ROLES.FARMER, ROLES.ADMIN),
  validate({ body: createFarmSchema }),
  (req, res, next) => controller.createFarm(req, res, next)
);

// GET /api/v1/farms - List farms (FARMER sees own, OFFICER/ADMIN can query)
router.get('/', (req, res, next) => controller.listFarms(req, res, next));

// GET /api/v1/farms/:id/overview - Consolidated farm overview
router.get(
  '/:id/overview',
  validate({ params: farmIdParamSchema }),
  (req, res, next) => controller.getFarmOverview(req, res, next)
);

// GET /api/v1/farms/:id - Get specific farm
router.get(
  '/:id',
  validate({ params: farmIdParamSchema }),
  (req, res, next) => controller.getFarmById(req, res, next)
);

// PATCH /api/v1/farms/:id - Update farm
router.patch(
  '/:id',
  validate({ params: farmIdParamSchema, body: updateFarmSchema }),
  (req, res, next) => controller.updateFarm(req, res, next)
);

// DELETE /api/v1/farms/:id - Soft delete farm
router.delete(
  '/:id',
  validate({ params: farmIdParamSchema }),
  (req, res, next) => controller.deleteFarm(req, res, next)
);

module.exports = router;

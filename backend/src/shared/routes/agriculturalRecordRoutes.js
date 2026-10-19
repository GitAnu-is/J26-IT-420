const { Router } = require('express');
const controller = require('../controllers/agriculturalRecordController');
const { authenticate } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { ROLES } = require('../constants/roles');
const {
  createRecordSchema,
  updateRecordSchema,
  recordIdParamSchema
} = require('../validators/agriculturalRecordValidator');

const router = Router();

// All agricultural record endpoints require authentication
router.use(authenticate);

// POST /api/v1/agricultural-records
router.post(
  '/',
  authorize(ROLES.FARMER, ROLES.ADMIN),
  validate({ body: createRecordSchema }),
  (req, res, next) => controller.createRecord(req, res, next)
);

// GET /api/v1/agricultural-records
router.get('/', (req, res, next) => controller.listRecords(req, res, next));

// GET /api/v1/agricultural-records/:id
router.get(
  '/:id',
  validate({ params: recordIdParamSchema }),
  (req, res, next) => controller.getRecordById(req, res, next)
);

// PATCH /api/v1/agricultural-records/:id
router.patch(
  '/:id',
  validate({ params: recordIdParamSchema, body: updateRecordSchema }),
  (req, res, next) => controller.updateRecord(req, res, next)
);

// DELETE /api/v1/agricultural-records/:id
router.delete(
  '/:id',
  validate({ params: recordIdParamSchema }),
  (req, res, next) => controller.deleteRecord(req, res, next)
);

module.exports = router;

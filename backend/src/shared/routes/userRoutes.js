const { Router } = require('express');
const controller = require('../controllers/userController');
const { authenticate } = require('../middleware/authenticate');
const { validate } = require('../middleware/validate');
const { updateProfileSchema } = require('../validators/userValidator');

const router = Router();

// GET /api/v1/users/me
router.get('/me', authenticate, (req, res, next) =>
  controller.getMe(req, res, next)
);

// PATCH /api/v1/users/me
router.patch('/me', authenticate, validate({ body: updateProfileSchema }), (req, res, next) =>
  controller.updateMe(req, res, next)
);

module.exports = router;

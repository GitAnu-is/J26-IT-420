const { Router } = require('express');
const controller = require('../controllers/authController');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/authenticate');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema
} = require('../validators/authValidator');

const router = Router();

// POST /api/v1/auth/register
router.post('/register', authLimiter, validate({ body: registerSchema }), (req, res, next) =>
  controller.register(req, res, next)
);

// POST /api/v1/auth/login
router.post('/login', authLimiter, validate({ body: loginSchema }), (req, res, next) =>
  controller.login(req, res, next)
);

// POST /api/v1/auth/refresh
router.post('/refresh', validate({ body: refreshTokenSchema }), (req, res, next) =>
  controller.refresh(req, res, next)
);

// POST /api/v1/auth/logout
router.post('/logout', validate({ body: refreshTokenSchema }), (req, res, next) =>
  controller.logout(req, res, next)
);

// POST /api/v1/auth/logout-all
router.post('/logout-all', authenticate, (req, res, next) =>
  controller.logoutAll(req, res, next)
);

// GET /api/v1/auth/me
router.get('/me', authenticate, (req, res, next) =>
  controller.getMe(req, res, next)
);

// POST /api/v1/auth/change-password
router.post('/change-password', authenticate, validate({ body: changePasswordSchema }), (req, res, next) =>
  controller.changePassword(req, res, next)
);

module.exports = router;

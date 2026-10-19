// Developer-facing handoff notes for the MERN web build (English only by design).
export const devNotes = [
{
  title: 'Stack overview',
  body: 'React web client (this app) talks to a Node.js + Express REST API backed by MongoDB (Mongoose). AI inference stays in a separate Python/FastAPI service that Express calls server-to-server. The browser never holds secrets.',
  code: `client/  React + react-router-dom + Tailwind
server/  Node 20 · Express 4 · Mongoose 8 · jsonwebtoken · bcrypt · zod
         helmet · cors · express-rate-limit · morgan
ml/      FastAPI model service (crop · disease · harvest · transport)`
},
{
  title: 'Client structure (this project)',
  body: 'Routing lives in App.tsx. Protected pages are wrapped in <ProtectedRoute>. All HTTP goes through utils/apiClient.ts, which adds the Bearer token, normalises errors into ApiError(status, code, fieldErrors) and fires a logout event on 401.',
  code: `App.tsx                    routes + providers
contexts/AuthContext.tsx   login / register / logout, token expiry watch
utils/apiClient.ts         fetch wrapper → ApiError
utils/authApi.ts           POST /auth/login · /auth/register · GET /auth/me
utils/apiErrors.ts         error code → translation key
utils/mockApi.ts           in-browser stand-in (set useMockApi=false for real API)
components/ProtectedRoute  redirect to /login with { from }
components/ErrorBoundary   render-crash fallback · pages/NotFound 404`
},
{
  title: 'Server folder layout',
  body: 'Feature-based so each research component can be developed and tested by a different team member.',
  code: `server/src/
  app.js               express(), middleware, routes, errorHandler
  config/env.js        PORT, MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN, ML_URL
  middleware/          auth.js · validate.js · errorHandler.js · notFound.js
  utils/AppError.js    class AppError(status, code, errors)
  modules/
    auth/        auth.routes.js · auth.controller.js · auth.schema.js
    users/       user.model.js
    assessments/ assessment.model.js · assessment.routes.js
    crop/ disease/ harvest/ transport/   *.routes.js · *.service.js`
},
{
  title: 'JWT auth middleware',
  body: 'Short-lived access token signed with JWT_SECRET from environment variables. Passwords are hashed with bcrypt (12 rounds).',
  code: `// middleware/auth.js
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

module.exports = function auth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new AppError(401, 'UNAUTHORIZED'));
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new AppError(401, 'UNAUTHORIZED'));
  }
};

// auth.controller.js (login)
const user = await User.findOne({ email }).select('+password');
if (!user || !(await bcrypt.compare(password, user.password)))
  throw new AppError(401, 'INVALID_CREDENTIALS');
const token = jwt.sign(
  { sub: user.id, name: user.name, email: user.email, role: user.role },
  process.env.JWT_SECRET, { expiresIn: '8h' });
res.json({ token, user: user.toPublic() });`
},
{
  title: 'Validation (zod)',
  body: 'Every body is validated before the controller runs. Failures return 422 with field codes the client translates.',
  code: `// auth.schema.js
const register = z.object({
  name: z.string().trim().min(1, 'REQUIRED'),
  email: z.string().trim().toLowerCase().email('INVALID_EMAIL'),
  role: z.enum(['farmer', 'officer', 'transport'], { message: 'INVALID_ROLE' }),
  password: z.string().min(8, 'PASSWORD_TOO_SHORT'),
});

// middleware/validate.js
module.exports = (schema) => (req, _res, next) => {
  const r = schema.safeParse(req.body);
  if (r.success) { req.body = r.data; return next(); }
  next(new AppError(422, 'VALIDATION_ERROR',
    r.error.issues.map((i) => ({ field: i.path.join('.'), code: i.message }))));
};

router.post('/register', validate(register), asyncHandler(controller.register));`
},
{
  title: 'Central error handling',
  body: 'One error format for the whole API. Unknown errors are logged and returned as 500 without stack traces. Duplicate Mongo keys become 409.',
  code: `// middleware/errorHandler.js
module.exports = (err, req, res, _next) => {
  if (err.code === 11000) err = new AppError(409, 'EMAIL_TAKEN');
  if (!(err instanceof AppError)) {
    req.log?.error(err);
    err = new AppError(500, 'INTERNAL_ERROR');
  }
  res.status(err.status).json({ code: err.code, errors: err.errors });
};

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/assessments', auth, assessmentRoutes);
app.use(notFound);        // → 404 { code: 'NOT_FOUND' }
app.use(errorHandler);`
},
{
  title: 'REST endpoints',
  body: 'All under /api/v1. Model outputs are stored with is_sample=false and model_version so history never mixes demo and real results.',
  code: `POST /auth/register        201 { token, user } · 409 EMAIL_TAKEN · 422
POST /auth/login           200 { token, user } · 401 INVALID_CREDENTIALS
GET  /auth/me              200 { user } · 401
POST /crop/recommend       → ranked crops + shap[]
POST /disease/predict      multipart image → label, confidence, severity, gradcam_url
POST /harvest/predict      → window_start/end, readiness, factors[]
POST /transport/assess     → risk_level, probability, factors[], recommendations[]
GET  /assessments?type=&q=&page=   POST /assessments   GET /assessments/:id
GET  /weather?district=    proxied server-side (API key stays on server)`
},
{
  title: 'Mongoose models',
  body: 'Assessments share one collection with a type discriminator, indexed by user and date for the history screen.',
  code: `User { name, email (unique, lowercase), password (select:false),
       role: farmer|officer|transport, locale: en|si|ta, district, crops[] }
Assessment { user: ObjectId, type: crop|disease|harvest|transport,
             cropCode, input: Mixed, result: Mixed, modelVersion,
             isSample: Boolean, status: done|follow_up, createdAt }
  index({ user: 1, createdAt: -1 })`
}];
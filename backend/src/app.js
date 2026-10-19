const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const { env } = require('./config/env');
const { corsOptions } = require('./config/cors');
const { requestLogger } = require('./shared/middleware/requestLogger');
const { notFoundHandler } = require('./shared/middleware/notFoundHandler');
const { errorHandler } = require('./shared/middleware/errorHandler');

// Shared routes
const healthRoutes = require('./shared/routes/healthRoutes');
const apiInfoRoutes = require('./shared/routes/apiInfoRoutes');
const authRoutes = require('./shared/routes/authRoutes');
const userRoutes = require('./shared/routes/userRoutes');
const farmRoutes = require('./shared/routes/farmRoutes');
const agriculturalRecordRoutes = require('./shared/routes/agriculturalRecordRoutes');

// Research component routes
const cropRecommendationRoutes = require('./components/c1_crop_recommendation/routes/cropRecommendationRoutes');
const diseaseDetectionRoutes = require('./components/c2_disease_detection/routes/diseaseDetectionRoutes');
const transportationRiskRoutes = require('./components/c4_transportation_risk/routes/transportationRiskRoutes');

const app = express();

// =============================================================================
// Security & Core Middleware
// =============================================================================
app.use(helmet());
app.use(cors(corsOptions));
app.use(requestLogger);

// Body Parsers with configurable payload limit
app.use(express.json({ limit: env.BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: env.BODY_LIMIT }));

// =============================================================================
// Root & Health Discovery Routes
// =============================================================================
app.use('/', apiInfoRoutes);
app.use('/health', healthRoutes);

// =============================================================================
// Versioned API Base Namespace (/api/v1)
// =============================================================================
const apiV1Router = express.Router();

// Root API v1 info and health
apiV1Router.use('/', apiInfoRoutes);
apiV1Router.use('/health', healthRoutes);

// Shared namespaces
apiV1Router.use('/auth', authRoutes);
apiV1Router.use('/users', userRoutes);
apiV1Router.use('/farms', farmRoutes);
apiV1Router.use('/agricultural-records', agriculturalRecordRoutes);

// Research Component 1: AI-Based Crop Recommendation and Harvest Planning
apiV1Router.use('/crops', cropRecommendationRoutes);

// Research Component 2: AI-Based Plant Disease Detection and Severity Assessment
apiV1Router.use('/diseases', diseaseDetectionRoutes);

// Research Component 4: AI-Based Transportation Risk Prediction and Smart Packaging
apiV1Router.use('/transportation', transportationRiskRoutes);

// Mount API v1 router
app.use(env.API_PREFIX, apiV1Router);

// =============================================================================
// Error Handling Middleware
// =============================================================================
// Handle 404 for unmapped paths
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;

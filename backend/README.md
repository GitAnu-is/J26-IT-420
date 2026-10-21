# AgriGuard Backend REST API

**Research Project:** AI-Powered Smart Agriculture Platform for Minimizing Post-Harvest Crop Losses  
**Research Group:** J26-IT-420  
**Institution:** Sri Lanka Institute of Information Technology (SLIIT)  
**Application:** Integrated Smart Agriculture Decision Support Platform  
**Implementation Phase:** Phase 6 — Complete Backend Integration, Security Hardening, and Research Validation  

---

## 1. Project Overview

AgriGuard is an AI-powered smart agriculture decision-support platform designed to reduce post-harvest agricultural losses across Sri Lankan supply chains. The backend serves as the unified API gateway, data persistence coordinator, and machine-learning orchestration layer for both a **React.js web application** and a **Flutter cross-platform mobile application**.

### Research Scope (Final Three Components)
Following academic supervisor approval, the platform focuses strictly on **three research components**:

1. **Component 1 — AI-Based Crop Recommendation and Harvest Planning System (`c1_crop_recommendation`)**
   - Analyzes Sri Lankan soil properties (pH, N, P, K, moisture) and agro-ecological zones.
   - Integrates live meteorological observations via OpenWeather API.
   - Recommends crops from supported cultivars: Banana, Pineapple, and Black Pepper using Random Forest Classification (98.12% accuracy, 0.9813 Macro F1 on synthetic agronomic prototype data).
   - Predicts harvest duration in days and practical harvest windows using Random Forest Regression (MAE: 9.21 days, R²: 0.9875).
2. **Component 2 — AI-Based Plant Disease Detection and Severity Assessment System (`c2_disease_detection`)**
   - Ingests plant leaf imagery via secure multipart upload with magic-byte validation and SHA-256 deduplication.
   - Detects disease strains across Banana, Pineapple, and Black Pepper using deep learning transfer learning.
   - Proposed Classifier: EfficientNet-B0 (**95.00% test accuracy**, **0.9514 Macro F1**, **73.79 ms mean latency**, **15.60 MB**).
   - Comparison Classifier: ResNet50 (50.00% test accuracy, 0.4141 Macro F1, 187.31 ms latency, 90.04 MB).
   - Generates class-discriminative Grad-CAM visual attribution heatmaps with authorized artifact retrieval.
   - Assesses disease severity using calibrated area rules, transparently returning `UNAVAILABLE` when verified lesion masks are absent without fabricating numbers from Grad-CAM.
   - Provides verified agricultural management recommendations citing Sri Lanka DOA and DEA publications.
3. **Component 4 — AI-Based Transportation Risk Prediction and Smart Packaging Recommendation System (`c4_transportation_risk`)**
   - Assesses transit distance, duration, vehicle type, packaging format, and road conditions across Sri Lankan logistics routes.
   - Predicts transportation damage probability and classifies risk as Low, Medium, or High using tree ensemble algorithms.
   - Evaluated candidate algorithms: Random Forest, XGBoost, CatBoost, and Gradient Boosting against a baseline classifier.
   - Deploys Gradient Boosting (85.83% test accuracy, 0.8452 Macro F1, 0.0958 Brier score, 0.008 ms latency) and XGBoost (86.67% test accuracy, 0.8535 Macro F1).
   - Delivers transparent Explainable AI using SHAP (`shap.TreeExplainer`) feature attributions and risk directionality.
   - Provides evidence-backed smart packaging, storage, and handling recommendations citing Sri Lanka DOA, DEA, and FAO compendia.
   - Operates completely independently without requiring the removed crop quality grading component.

> **Supervisor Scope Revision Notice:**  
> The originally envisioned Component 3 (*"AI-Based Harvest Quality Grading and Market Readiness Prediction System"*) has been **officially excluded**. The codebase contains no quality grading, market readiness, or shelf-life estimation modules or dependencies. Component 4 operates completely independently.

---

## 2. Technology Stack

- **Runtime:** Node.js v20+ LTS
- **Framework:** Express.js 4.x
- **Database & ODM:** MongoDB Atlas / Local MongoDB via Mongoose 8.x
- **Schema & Input Validation:** Zod
- **Security:** Helmet, Dynamic Cross-Origin Resource Sharing (CORS)
- **Environment Management:** Dotenv with validation schema
- **Structured Logging:** Pino and Pino-Pretty with sensitive data redaction
- **Automated Testing:** Jest and Supertest
- **Development Tooling:** Nodemon

---

## 3. Directory Structure

```text
backend/
├── docs/
│   └── architecture.md               # Detailed system architecture & integration guide
├── src/
│   ├── app.js                         # Express application setup, middleware, and route mounting
│   ├── server.js                      # HTTP server lifecycle, database connection, and graceful shutdown
│   │
│   ├── config/
│   │   ├── env.js                     # Zod environment variable validation and parsing
│   │   ├── database.js                # Mongoose connection pooling and lifecycle handlers
│   │   └── cors.js                    # Web and mobile CORS origin policy configuration
│   │
│   ├── components/
│   │   ├── c1_crop_recommendation/
│   │   │   ├── controllers/           # C1 HTTP handlers
│   │   │   ├── routes/                # /api/v1/crops routes
│   │   │   ├── services/              # C1 business logic orchestration
│   │   │   ├── adapters/              # C1 Python ML inference adapter (Random Forest)
│   │   │   ├── validators/            # C1 Zod validation schemas
│   │   │   ├── models/                # Schema definitions (Phase 2)
│   │   │   └── tests/                 # Component test suite
│   │   │
│   │   ├── c2_disease_detection/
│   │   │   ├── controllers/           # C2 HTTP handlers
│   │   │   ├── routes/                # /api/v1/diseases routes
│   │   │   ├── services/              # C2 business logic orchestration
│   │   │   ├── adapters/              # C2 Python DL inference adapter (EfficientNet, ResNet50, Grad-CAM)
│   │   │   ├── validators/            # C2 Zod validation schemas
│   │   │   ├── models/                # Schema definitions (Phase 2)
│   │   │   └── tests/                 # Component test suite
│   │   │
│   │   └── c4_transportation_risk/
│   │       ├── controllers/           # C4 HTTP handlers
│   │       ├── routes/                # /api/v1/transportation routes
│   │       ├── services/              # C4 business logic orchestration
│   │       ├── adapters/              # C4 Python ML inference adapter (XGBoost, CatBoost, SHAP)
│   │       ├── validators/            # C4 Zod validation schemas
│   │       ├── models/                # Schema definitions (Phase 2)
│   │       └── tests/                 # Component test suite
│   │
│   ├── shared/
│   │   ├── constants/                 # Standardized crop constants (BANANA, PINEAPPLE, BLACK_PEPPER)
│   │   ├── controllers/               # System health and root info controllers
│   │   ├── errors/                    # Standard AppError hierarchy
│   │   ├── middleware/                # Error handling, request logging, auth, and Zod validation
│   │   ├── routes/                    # Health, root info, auth, and users router namespaces
│   │   ├── utils/                     # Pino logger and standard API response envelope helpers
│   │   ├── models/                    # Shared MongoDB schemas (Phase 2)
│   │   ├── services/                  # Shared external services (Phase 2)
│   │   └── validators/                # Shared validator schemas (Phase 2)
│   │
│   └── tests/                         # End-to-end integration and unit tests
│       ├── api.test.js                # Core API, route discovery, and error handling tests
│       ├── components.test.js         # Component isolation, contracts, and C3 exclusion tests
│       ├── crops.test.js              # Supported crops normalization and metadata tests
│       ├── env.test.js                # Environment variable schema validation tests
│       ├── health.test.js             # System health check verification tests
│       └── securityAndMiddleware.test.js # CORS, Auth foundation, and error boundary tests
│
├── .env.example                       # Documented environment variable template
├── .gitignore                         # Git exclusion rules
├── package.json                       # Project manifest and scripts
└── README.md                          # Documentation
```

---

## 4. Prerequisites

- **Node.js:** v20.x or later (LTS recommended)
- **npm:** v10.x or later
- **MongoDB:** Active MongoDB Atlas cluster or local MongoDB instance running on port `27017`

---

## 5. Installation and Setup

### Step 1: Navigate to the Backend Directory
```bash
cd backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy the template file `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```

Configure your connection settings in `.env`:
```env
# Server Runtime
NODE_ENV=development
PORT=5000
HOST=0.0.0.0

# Database Connection String (Local MongoDB or MongoDB Atlas template)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.ishquho.mongodb.net/agriguard?retryWrites=true&w=majority

# Cross-Origin Whitelist (Comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Logging
LOG_LEVEL=info
BODY_LIMIT=10mb
API_PREFIX=/api/v1
```

---

## 6. Running the Application

### Development Mode (with Live Reloading)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### API Base URL
- **Local Web:** `http://localhost:5000/api/v1`
- **Root Info:** `http://localhost:5000/`
- **Health Check:** `http://localhost:5000/api/v1/health`

---

## 7. Available Phase 2 API Endpoints

### Core & Health Endpoints
| Method | Endpoint | Auth | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | None | Root API platform discovery and metadata | Active |
| `GET` | `/api/v1` | None | Versioned API specification and module index | Active |
| `GET` | `/api/v1/health` | None | Comprehensive system, database, and component health | Active |
| `GET` | `/health` | None | Lightweight health check shortcut | Active |

### Authentication & Session Endpoints (`/api/v1/auth`)
| Method | Endpoint | Auth | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | None | Register new user (`FARMER`, `AGRICULTURAL_OFFICER`, `TRANSPORT_OPERATOR`) | Active |
| `POST` | `/api/v1/auth/login` | None | Authenticate credentials; return JWT access & refresh tokens | Active |
| `POST` | `/api/v1/auth/refresh` | None | Rotate refresh token with cryptographic reuse detection | Active |
| `POST` | `/api/v1/auth/logout` | Bearer | Revoke current refresh session | Active |
| `POST` | `/api/v1/auth/logout-all` | Bearer | Invalidate all active sessions for authenticated user | Active |
| `GET` | `/api/v1/auth/me` | Bearer | Retrieve authenticated user profile (excluding passwordHash) | Active |
| `POST` | `/api/v1/auth/change-password` | Bearer | Verify current password, update hash, revoke sessions | Active |

### User Management Endpoints (`/api/v1/users`)
| Method | Endpoint | Auth | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users/me` | Bearer | Get current user's profile | Active |
| `PATCH` | `/api/v1/users/me` | Bearer | Update profile (`fullName`, `phoneNumber` only) | Active |

### Farm Management Endpoints (`/api/v1/farms`)
| Method | Endpoint | Auth | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/farms` | Bearer | Register new farm with location & supported crops | Active |
| `GET` | `/api/v1/farms` | Bearer | List farms owned by authenticated user (paginated) | Active |
| `GET` | `/api/v1/farms/:id` | Bearer | Retrieve specific farm (with ownership check) | Active |
| `PATCH` | `/api/v1/farms/:id` | Bearer | Update farm details (with ownership check) | Active |
| `DELETE` | `/api/v1/farms/:id` | Bearer | Soft-delete / archive farm (preserves research history) | Active |

### Agricultural Record Management Endpoints (`/api/v1/agricultural-records`)
| Method | Endpoint | Auth | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/agricultural-records` | Bearer | Record crop cycle, soil NPK, pH, moisture, dates | Active |
| `GET` | `/api/v1/agricultural-records` | Bearer | List agricultural records owned by authenticated user | Active |
| `GET` | `/api/v1/agricultural-records/:id` | Bearer | Retrieve specific record (with ownership check) | Active |
| `PATCH` | `/api/v1/agricultural-records/:id` | Bearer | Update record measurements (with ownership check) | Active |
| `DELETE` | `/api/v1/agricultural-records/:id` | Bearer | Delete agricultural record (with ownership check) | Active |

### Component 1: Crop Recommendation & Harvest Planning (`/api/v1/crops`)
| Method | Endpoint | Auth | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/crops` | None | C1 module capabilities and crop agronomic specifications | Active |
| `POST` | `/api/v1/crops/recommend` | Optional | Random Forest crop suitability prediction (with OpenWeather enrichment & persistence) | Active |
| `POST` | `/api/v1/crops/predict-harvest` | Optional | Random Forest harvest duration & window regression (with persistence) | Active |
| `GET` | `/api/v1/crops/history` | Bearer | Historical recommendations & predictions persisted in MongoDB | Active |

### Component 2: Plant Disease Detection & Severity (`/api/v1/diseases`)
| Method | Endpoint | Auth | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/diseases` | None | C2 module capabilities, supported crops, validated disease classes, and DL models | Active |
| `POST` | `/api/v1/diseases/analyze` | Optional | Secure multipart image upload, deep learning classification, Grad-CAM generation, severity evaluation, and MongoDB persistence | Active |
| `GET` | `/api/v1/diseases/history` | Bearer | Historical disease assessments with crop, disease, and date filtering (paginated) | Active |
| `GET` | `/api/v1/diseases/assessments/:id` | Bearer | Retrieve specific disease assessment with full metadata, guidance, and artifact links | Active |
| `GET` | `/api/v1/diseases/assessments/:id/gradcam` | Bearer | Retrieve authorized Grad-CAM visual attribution overlay image artifact | Active |
| `GET` | `/api/v1/diseases/assessments/:id/image` | Bearer | Retrieve authorized original uploaded plant leaf image artifact | Active |

### Component 4: Transportation Risk & Smart Packaging (`/api/v1/transportation`)
| Method | Endpoint | Auth | Description | Status |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/transportation` | None | C4 module capabilities, transport modes, models, and readiness | Active |
| `POST` | `/api/v1/transportation/predict-risk` | Optional | Predict transit damage probability, risk level, SHAP explanation & guidance (with MongoDB persistence) | Active |
| `POST` | `/api/v1/transportation/recommend-packaging` | Optional | Evidence-backed smart packaging, storage, and handling recommendations | Active |
| `GET` | `/api/v1/transportation/history` | Bearer | Historical transport risk assessments for authenticated user (paginated & filtered) | Active |
| `GET` | `/api/v1/transportation/assessments/:id` | Bearer | Retrieve specific transportation assessment with full SHAP attributions and packaging guidance | Active |

---

## 8. Standard API Response Design

All API responses follow a uniform JSON structure:

### Standard Success Response (HTTP 200 / 201)
```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": { ... }
}
```

### Standard Error Response (HTTP 4xx / 5xx)
```json
{
  "success": false,
  "message": "Human-readable explanation of error",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "ph",
        "message": "pH must be at least 3.0"
      }
    ]
  }
}
```

### Example 1: User Registration (`POST /api/v1/auth/register`)
**Request Body:**
```json
{
  "fullName": "Sunil Jayawardena",
  "email": "sunil.j@farmer.sliit.lk",
  "password": "SecurePassword123!",
  "phoneNumber": "+94771234567",
  "role": "FARMER"
}
```

**Response (HTTP 201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "671302b1f8c12a0019e12345",
      "fullName": "Sunil Jayawardena",
      "email": "sunil.j@farmer.sliit.lk",
      "phoneNumber": "+94771234567",
      "role": "FARMER",
      "isActive": true,
      "lastLoginAt": null,
      "createdAt": "2026-10-19T01:00:00.000Z",
      "updatedAt": "2026-10-19T01:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "4a7f9b8c2d1e0f3a5b6c7d8e9f0a1b2c..."
  }
}
```

### Example 2: Farm Registration (`POST /api/v1/farms`)
**Headers:** `Authorization: Bearer <accessToken>`  
**Request Body:**
```json
{
  "farmName": "Gampaha Golden Harvest",
  "district": "Gampaha",
  "agroEcologicalZone": "WL2a",
  "location": {
    "latitude": 7.084,
    "longitude": 79.993
  },
  "soilType": "Red-Yellow Podzolic",
  "area": 2.5,
  "areaUnit": "ACRES",
  "supportedCrops": ["BANANA", "PINEAPPLE"]
}
```

**Response (HTTP 201 Created):**
```json
{
  "success": true,
  "message": "Farm registered successfully",
  "data": {
    "id": "671303c2f8c12a0019e12346",
    "ownerId": "671302b1f8c12a0019e12345",
    "farmName": "Gampaha Golden Harvest",
    "district": "Gampaha",
    "agroEcologicalZone": "WL2a",
    "location": {
      "latitude": 7.084,
      "longitude": 79.993
    },
    "soilType": "Red-Yellow Podzolic",
    "area": 2.5,
    "areaUnit": "ACRES",
    "supportedCrops": ["BANANA", "PINEAPPLE"],
    "isArchived": false,
    "createdAt": "2026-10-19T01:05:00.000Z",
    "updatedAt": "2026-10-19T01:05:00.000Z"
  }
}
```

### Example 3: AI Crop Recommendation (`POST /api/v1/crops/recommend`)
**Headers:** `Authorization: Bearer <accessToken>` (Optional for guests, enables persistence for farmers)  
**Request Body:**
```json
{
  "farmId": "671303c2f8c12a0019e12346",
  "nitrogen": 180,
  "phosphorus": 55,
  "potassium": 340,
  "ph": 6.3,
  "moisture": 75,
  "district": "Gampaha",
  "season": "MAHA"
}
```

**Response (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Crop recommendation generated successfully",
  "data": {
    "recommendedCrop": "BANANA",
    "confidence": 0.9988,
    "classProbabilities": {
      "BANANA": 0.9988,
      "PINEAPPLE": 0.0008,
      "BLACK_PEPPER": 0.0004
    },
    "modelIdentifier": "c1_crop_random_forest",
    "modelVersion": "v1.0",
    "predictionTimestamp": "2026-10-18T20:28:50Z",
    "farmId": "671303c2f8c12a0019e12346",
    "weatherProvenance": {
      "source": "OpenWeather",
      "stationName": "Gampaha",
      "coordinates": { "latitude": 7.084, "longitude": 79.993 },
      "observationTimestamp": "2026-10-18T20:25:00Z"
    },
    "savedPredictionId": "671304e3f8c12a0019e12350"
  }
}
```

### Example 4: AI Harvest Time & Window Prediction (`POST /api/v1/crops/predict-harvest`)
**Headers:** `Authorization: Bearer <accessToken>`  
**Request Body:**
```json
{
  "crop": "BANANA",
  "plantingDate": "2026-05-01",
  "variety": "Ambul",
  "district": "Gampaha",
  "season": "YALA",
  "soilPh": 6.2,
  "soilMoisture": 70
}
```

**Response (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Harvest window predicted successfully",
  "data": {
    "cropType": "BANANA",
    "predictedDurationDays": 298,
    "predictedHarvestDate": "2027-02-23",
    "harvestWindow": {
      "startDate": "2027-02-11",
      "endDate": "2027-03-07"
    },
    "confidenceMarginDays": 12,
    "modelIdentifier": "c1_harvest_random_forest",
    "modelVersion": "v1.0",
    "predictionTimestamp": "2026-10-18T20:29:06Z",
    "farmId": null,
    "savedPredictionId": "671305f4f8c12a0019e12351"
  }
}
```

### Example 5: Plant Disease Analysis (`POST /api/v1/diseases/analyze`)
**Headers:** `Authorization: Bearer <accessToken>`, `Content-Type: multipart/form-data`  
**Form Fields:**
- `image`: *(Binary leaf image file — JPEG/PNG/WebP, up to 8 MB)*
- `cropType`: `BANANA`
- `farmId`: `671303c2f8c12a0019e12346` (Optional)

**Response (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Plant disease analysis completed successfully",
  "data": {
    "cropType": "BANANA",
    "predictedDisease": "Sigatoka Leaf Spot",
    "confidence": 0.9984,
    "classProbabilities": {
      "Banana Bunchy Top Virus (BBTV)": 0.0006,
      "Healthy Foliage": 0.001,
      "Sigatoka Leaf Spot": 0.9984
    },
    "severity": null,
    "severityStatus": "UNAVAILABLE",
    "severityMethod": "LESION_AREA_SEGMENTATION",
    "gradCamArtifactReference": "/api/v1/diseases/assessments/671306a5f8c12a0019e12360/gradcam",
    "imageReference": "/api/v1/diseases/assessments/671306a5f8c12a0019e12360/image",
    "managementGuidance": {
      "crop": "BANANA",
      "disease": "Sigatoka Leaf Spot",
      "recommendedActions": [
        "Systematically de-leaf severely affected fronds exhibiting necrotic streaks to curtail conidial inoculum load.",
        "Ensure field drainage and maintain 3m x 3m planting density to promote canopy aeration and reduce relative humidity.",
        "Apply mineral oil or registered protective copper-based foliar fungicides during monsoon onset under Agricultural Extension advisory."
      ],
      "requiresOfficerConsultation": false,
      "citation": "Department of Agriculture Sri Lanka — Advisory Circular on Banana Sigatoka Management (2022)"
    },
    "modelIdentifier": "c2_efficientnet_b0",
    "modelVersion": "v1.0",
    "datasetVersion": "v1.0",
    "assessmentStatus": "COMPLETED",
    "predictionTimestamp": "2026-10-18T21:40:00.000Z",
    "assessmentId": "671306a5f8c12a0019e12360"
  }
}
```

### Example 6: Transportation Risk Prediction (`POST /api/v1/transportation/predict-risk`)
**Headers:** `Authorization: Bearer <accessToken>` (Optional for guests, enables persistence for authenticated users)  
**Request Body:**
```json
{
  "crop": "BANANA",
  "farmId": "671303c2f8c12a0019e12346",
  "distanceKm": 140,
  "durationHours": 4.5,
  "vehicleType": "COVERED_TRUCK",
  "packagingType": "PLASTIC_CRATES",
  "roadCondition": "MIXED",
  "temperatureCelsius": 29.5,
  "humidityPercentage": 78
}
```

**Response (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Transportation risk prediction calculated successfully",
  "data": {
    "cropType": "BANANA",
    "damageProbability": 0.1842,
    "riskLevel": "LOW",
    "riskStatus": "COMPLETED",
    "modelIdentifier": "Gradient Boosting Classifier",
    "modelVersion": "1.0.0",
    "datasetVersion": "1.0.0",
    "shapExplanation": {
      "baseValue": 0.284,
      "attributions": [
        { "feature": "packaging_type_PLASTIC_CRATES", "value": 1.0, "shapValue": -0.142 },
        { "feature": "travel_speed_kmh", "value": 31.11, "shapValue": -0.065 },
        { "feature": "road_condition_MIXED", "value": 1.0, "shapValue": 0.082 }
      ],
      "riskElevatingFactors": [
        "Mixed road condition contributed moderately to vibration and mechanical stress"
      ],
      "riskMitigatingFactors": [
        "Rigid ventilated plastic crate packaging provided substantial mechanical protection",
        "Moderate transit speed (31.1 km/h) minimized sudden acceleration and dynamic vibration"
      ],
      "explanationSummary": "Predicted damage probability of 18.42% is driven down primarily by packaging_type_PLASTIC_CRATES (SHAP: -0.1420), but elevated by road_condition_MIXED (SHAP: +0.0820).",
      "disclaimer": "SHAP feature attributions reflect model feature importance on the evaluation dataset and do not imply causal relationships."
    },
    "packagingRecommendation": {
      "ruleId": "RULE-BAN-001",
      "recommendedPackaging": "Stackable Ventilated Plastic Crates (400x300x250mm) with Paper Liners",
      "storageGuidance": [
        "Pre-cool to 13-14°C before loading to minimize respiration rate and latex exudation.",
        "Maintain relative humidity between 85% and 90% to avoid premature bunch desiccation."
      ],
      "handlingGuidance": [
        "Stack crates no more than 5 layers high with interlocking alignment to prevent toppling.",
        "Handle banana clusters strictly by the crown/stalk; avoid direct contact with fruit fingers."
      ],
      "transportationGuidance": [
        "Schedule transport during early morning or evening hours to avoid thermal accumulation.",
        "Secure crates tightly with load-lock bars to mitigate transit vibration across mixed roads."
      ],
      "supportingReferences": [
        "Sri Lanka Department of Agriculture (DOA) Post-Harvest Technology Division Circular 2021/04",
        "FAO Post-Harvest Compendium - Banana Handling and Cold Chain Practices"
      ],
      "ruleVersion": "1.0.0",
      "reviewStatus": "AGRONOMIC_EXPERT_ALIGNED"
    },
    "executionLatencyMs": 0.22,
    "timestamp": "2026-10-19T04:00:00Z",
    "assessmentId": "671307b6f8c12a0019e12370"
  }
}
```

### Example 7: Smart Packaging Recommendation (`POST /api/v1/transportation/recommend-packaging`)
**Request Body:**
```json
{
  "crop": "BLACK_PEPPER",
  "distanceKm": 180,
  "vehicleType": "COVERED_TRUCK",
  "expectedDurationHours": 5,
  "currentPackagingType": "GUNNY_BAGS",
  "temperatureCelsius": 28,
  "humidityPercentage": 75
}
```

**Response (HTTP 200 OK):**
```json
{
  "success": true,
  "message": "Smart packaging recommendations generated successfully",
  "data": {
    "cropType": "BLACK_PEPPER",
    "ruleId": "RULE-PEP-001",
    "recommendedPackaging": "Double-Walled Jute / Gunny Bags with Food-Grade Polyethylene Liners (50 micron)",
    "storageGuidance": [
      "Ensure black pepper berry moisture content is strictly <= 11% prior to packaging.",
      "Store bags in well-ventilated, dry conditions off the floor on clean wooden pallets."
    ],
    "handlingGuidance": [
      "Do not use metal hooks during loading to prevent puncture of protective inner liners.",
      "Protect packages from cross-contamination with agrochemicals or volatile substances."
    ],
    "transportationGuidance": [
      "Transport exclusively in clean, dry, covered vehicles with waterproof tarpaulin backup.",
      "Avoid transit during heavy monsoon downpours unless hermetically sealed containers are utilized."
    ],
    "contextualWarnings": [],
    "supportingReferences": [
      "Department of Export Agriculture (DEA) Sri Lanka — Technical Bulletin on Black Pepper Post-Harvest Processing & Packaging (2019)",
      "International Pepper Community (IPC) Guidelines for Black Pepper Quality Maintenance in Transit"
    ],
    "ruleVersion": "1.0.0",
    "reviewStatus": "AGRONOMIC_EXPERT_ALIGNED",
    "timestamp": "2026-10-19T04:00:00Z"
  }
}
```

---

## 9. Automated Testing

The platform includes a rigorous automated test suite comprising **12 Node.js Jest test suites** (163 unit and integration tests) with automated MongoDB test database isolation, complemented by **3 Python pytest test suites** (67 machine learning and deep learning tests) across Components 1, 2, and 4.

### Test Coverage Highlights
- **Authentication Lifecycle:** Registration, email duplication rejection, password hashing, admin self-registration prevention, credential validation, user enumeration prevention, inactive account rejection.
- **Session Security:** Refresh token rotation, token reuse/replay detection (instant session family invalidation), expired token rejection, logout, logout-all, password change session invalidation.
- **Authorization & Ownership:** Cross-user resource tampering prevention, role checks, Bearer JWT validation.
- **Farm & Records Management:** CRUD operations, coordinates validation, crop normalization, soft deletion, agronomic range enforcement, planting/harvest date validation.
- **Component 1 AI & Weather Integration:** Soil input validation, biological pH/NPK checks, cross-user farm context protection, OpenWeather fallback, Python microservice timeout handling, output validation, authenticated MongoDB persistence, and history pagination.
- **Component 2 Deep Learning & Image Storage:** Multipart image upload, MIME/magic-byte verification, file extension spoofing defense, 8MB limit enforcement, corrupted image rejection, cross-user farm context protection, Python service 503/timeout handling, Grad-CAM artifact persistence, severity transparency (`UNAVAILABLE`), management guidance matching, history pagination, and ownership isolation.
- **Component 4 Transportation Risk & Smart Packaging:** Route registration, full input validation, farm ownership enforcement, 501/503 microservice boundary handling, probability range check [0, 1], calibrated risk threshold mapping (Low/Medium/High), SHAP attributions validation, crop-specific smart packaging rules (Banana, Pineapple, Black Pepper), authenticated MongoDB persistence, and cross-user history isolation (35 test cases).

### Execute All Tests
```bash
# Node.js Express Automated Test Suite (12 suites, 163 tests)
cd backend
npm test

# Python Machine Learning Test Suites (67 tests across C1, C2, and C4)
python -m pytest --import-mode=importlib ml-services/c1_crop_recommendation/tests/ ml-services/c2_disease_detection/tests/ ml-services/c4_transportation_risk/tests/
```

**Latest Test Results:**
```text
Node.js Express Test Suites: 12 passed, 12 total (163 tests passed, 0 failed)
Python ML/DL Test Suites:     3 passed,  3 total (67 tests passed, 0 failed)
Total Passing Automated Tests: 230 passed, 0 failed
```

---

## 10. Multi-Client Integration Guide

### A. React.js Web Application Integration
1. Set the API base URL in your frontend environment:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api/v1
   ```
2. The backend whitelist (`CORS_ORIGINS`) supports `http://localhost:5173` out of the box.
3. **Secure Token Handling:**
   - Store short-lived `accessToken` in JavaScript memory / application state (React Context or Redux). Never persist long-lived access tokens in `localStorage` to avoid XSS vulnerabilities.
   - Use Axios interceptors to automatically attach `Authorization: Bearer <accessToken>` and intercept 401 responses to call `POST /api/v1/auth/refresh`.

### B. Flutter Cross-Platform Mobile Application Integration
1. **Android Emulator:** The Android emulator routes localhost via `10.0.2.2`:
   ```dart
   const String apiBaseUrl = 'http://10.0.2.2:5000/api/v1';
   ```
2. **Physical Device:** Connect device to the same Wi-Fi network and use workstation LAN IP:
   ```dart
   const String apiBaseUrl = 'http://192.168.1.X:5000/api/v1';
   ```
3. **Secure Token Storage:**
   - Store access and refresh tokens using `flutter_secure_storage` (backed by Android Keystore and iOS Keychain).
   - Implement a Dio `QueuedInterceptor` that pauses requests upon 401, issues `POST /api/v1/auth/refresh`, updates secure storage, and retries the pending request queue.

---

## 11. Component 1 Machine Learning Evaluation & Integration

### A. Crop Recommendation Model Evaluation
- **Algorithm:** Random Forest Classifier (`n_estimators=150, max_depth=12, class_weight='balanced'`)
- **Dataset:** 2,400 balanced records grounded in Sri Lanka Department of Agriculture agronomic criteria across 15 agricultural districts.
- **5-Fold Cross-Validation Macro F1:** 0.9891 (± 0.0048)
- **Held-Out Test Set Metrics (480 samples):**
  - **Accuracy:** 98.12%
  - **Macro Precision:** 0.9815
  - **Macro Recall:** 0.9813
  - **Macro F1-Score:** 0.9813
  - **Majority Baseline F1:** 0.1667
  - **Agronomic Rule Baseline F1:** 0.9276
  - **Inference Latency:** 0.12 ms/sample

### B. Harvest Duration Prediction Model Evaluation
- **Algorithm:** Random Forest Regressor (`n_estimators=150, max_depth=10`)
- **Target:** Total duration in days from planting to harvest (`harvest_duration_days`).
- **Held-Out Test Set Metrics (480 samples):**
  - **Overall MAE:** 9.21 days
  - **Overall RMSE:** 11.74 days
  - **Overall R²:** 0.9875
  - **Crop-Median Baseline MAE:** 16.56 days
  - **Inference Latency:** 0.15 ms/sample
  - **Per-Crop Breakdown:**
    - Banana: MAE 8.00 days (typical duration ~315 days, 2.5% error)
    - Pineapple: MAE 12.66 days (typical duration ~480 days, 2.6% error)
    - Black Pepper: MAE 6.96 days (typical duration ~240 days, 2.9% error)

### C. Research Provenance & Real-Data Validation Plan
- **Dataset Provenance:** The 2,400 training samples are **agronomically modeled synthetic prototype records** derived from Sri Lanka Department of Agriculture (DOA) and Department of Export Agriculture (DEA) crop suitability criteria and empirical district-level microclimates, not in-situ IoT field sensor measurements.
- **Biological Starting Events:**
  - **Banana:** Sucker or tissue-culture planting date to fruit bunch maturity.
  - **Pineapple:** Slip or sucker planting date to physiological maturity (break of eye color).
  - **Black Pepper:** Post-monsoon spike emergence / flowering date to mature berry harvest.
- **Uncertainty Margin:** The ±12-day window represents an empirical 1-sigma RMSE margin. Formal conformal prediction with calibrated 95% coverage requires ongoing field calibration trials.

---

## 12. Component 2 Deep Learning Evaluation & Computer Vision Integration

### A. Deep Learning Architecture Comparison & Evaluation
Evaluated on the held-out test partition (stratified 10% test split, zero data leakage):

| Metric | EfficientNet-B0 (Proposed Primary) | ResNet50 (Comparison Benchmark) |
| :--- | :---: | :---: |
| **Test Accuracy** | **95.00%** | 50.00% |
| **Macro Precision** | **0.9643** | 0.4479 |
| **Macro Recall** | **0.9500** | 0.5000 |
| **Macro F1-Score** | **0.9514** | 0.4141 |
| **Weighted F1-Score** | **0.9514** | 0.4141 |
| **Mean CPU Latency** | **73.79 ms** | 187.31 ms |
| **Model Disk Footprint** | **15.60 MB** | 90.04 MB |
| **Total Parameters** | **4,017,796** | 23,524,424 |

**Architecture Decision:** EfficientNet-B0 was selected for production deployment because it delivers 45.0% higher test accuracy, 5.7x smaller model size, and 2.5x faster CPU inference compared to ResNet50.

### B. Validated Supported Disease Classes
| Class Identifier | Crop | Disease Display Name |
| :--- | :--- | :--- |
| `BANANA___BUNCHY_TOP` | Banana | Banana Bunchy Top Virus (BBTV) |
| `BANANA___HEALTHY` | Banana | Healthy Foliage |
| `BANANA___SIGATOKA` | Banana | Sigatoka Leaf Spot (*Pseudocercospora spp.*) |
| `BLACK_PEPPER___HEALTHY` | Black Pepper | Healthy Foliage & Spikes |
| `BLACK_PEPPER___POLLU_DISEASE` | Black Pepper | Pollu Disease / Anthracnose (*Colletotrichum gloeosporioides*) |
| `BLACK_PEPPER___QUICK_WILT` | Black Pepper | Quick Wilt / Foot Rot (*Phytophthora capsici*) |
| `PINEAPPLE___HEALTHY` | Pineapple | Healthy Foliage |
| `PINEAPPLE___HEART_ROT` | Pineapple | Heart Rot / Top Rot (*Phytophthora nicotianae*) |

### C. Severity Assessment Policy & Research Transparency
- **Lesion Area Thresholds:** `< 15%` (Low), `15% - 40%` (Medium), `> 40%` (High), `Healthy` (NOT_APPLICABLE).
- **Grad-CAM Attribution vs Lesion Segmentation:** Grad-CAM heatmaps represent convolutional network gradient attribution toward the predicted class, **not pixel-precise lesion masks**. Calculating disease severity percentages directly from Grad-CAM activation thresholds is methodologically invalid.
- **Unvalidated Data Handling:** When verified lesion segmentation masks or expert multi-class annotations are unavailable, severity is transparently returned as `severity: null` and `severityStatus: "UNAVAILABLE"` rather than fabricating an uncalibrated grade.

### D. Component Independence & Boundary Enforcement
- **Component 2 Independence:** Component 2 operates completely independently of Component 1. Users can upload images for Banana, Pineapple, or Black Pepper without running crop recommendations.
- **Component 3 Removal:** Component 3 (*Harvest Quality Grading & Market Readiness*) was permanently removed with supervisor approval. Foliar disease severity assessment belongs strictly to Component 2 and must never be conflated with harvested-produce market quality grading.
- **Component 4 Integration:** Component 4 operates independently as an AI-based transportation risk prediction and smart packaging recommendation system, without dependencies on removed quality grading.

---

## 13. Component 4 Machine Learning Evaluation & Smart Packaging Integration

### A. Transportation Damage Risk Model Comparison & Evaluation
Evaluated on the held-out test partition (120 trips, 10% test split, grouped by origin/destination districts, zero target leakage):

| Model / Algorithm | Test Accuracy | Macro Precision | Macro Recall | Macro F1 | Brier Score | ROC-AUC | Inference Latency | Model Disk Footprint |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline (Dummy Most Frequent)** | 61.67% | 0.3083 | 0.5000 | 0.3814 | 0.2384 | 0.5000 | 0.003 ms | 2 KB |
| **Random Forest Classifier** | 81.67% | 0.8143 | 0.8016 | 0.8061 | 0.1241 | 0.9080 | 0.236 ms | 2,304 KB |
| **CatBoost Classifier** | 84.17% | 0.8354 | 0.8228 | 0.8269 | 0.1008 | 0.9412 | 0.017 ms | 124 KB |
| **Gradient Boosting Classifier (Selected)** | **85.83%** | **0.8504** | **0.8415** | **0.8452** | **0.0958** | **0.9497** | **0.008 ms** | **362 KB** |
| **XGBoost Classifier (Selected Benchmark)** | **86.67%** | **0.8580** | **0.8503** | **0.8535** | **0.0997** | **0.9482** | **0.020 ms** | **281 KB** |

**Architecture Decision:** Gradient Boosting Classifier was selected as the primary production engine because it achieved the lowest Brier calibration score (0.0958), outstanding Macro F1 (0.8452), and ultra-low CPU latency (0.008 ms/sample) with a compact 362 KB artifact, closely paired with XGBoost (86.67% accuracy).

### B. Engineered Transit Features & Preprocessing Pipeline
- **Pipeline:** `ColumnTransformer` fitted strictly on training data (`train.csv`) incorporating `StandardScaler` for continuous features and `OneHotEncoder` for categoricals.
- **Engineered Features:**
  - `travel_speed_kmh = distance_km / duration_hours`: Detects excessive transit speeds (shock and vibration risk) and abnormally prolonged transit delays (respiration/decay risk).
  - `thermal_stress_index`: Non-linear formulation measuring physiological temperature and relative humidity deviations from optimal crop-specific storage bands (e.g. 13-14°C for Banana, 7-10°C for Pineapple, dry ambient for Black Pepper).

### C. Calibrated Risk Categorization Policy
- **LOW:** Predicted damage probability < 0.25 (Safe transit conditions; standard packaging adequate).
- **MEDIUM:** Predicted damage probability 0.25 - 0.65 (Moderate transit risk; requires enhanced cushioning, liner protection, or transit schedule adjustment).
- **HIGH:** Predicted damage probability > 0.65 (Critical transit risk; requires active refrigeration, rigid containerization, or route alteration).

### D. SHAP Explainable AI (`shap.TreeExplainer`)
- Computes exact local Shapley feature attributions for every prediction instance.
- Separates factors into:
  - **Risk-Elevating Factors:** Factors with positive SHAP values pushing probability towards damage (e.g. rough unpaved roads, open trucks, loose bulk packaging, extreme temperatures).
  - **Risk-Mitigating Factors:** Factors with negative SHAP values reducing damage risk (e.g. rigid plastic crates, optimal travel speeds, covered vehicles).
- Includes structured explanations for non-technical users and explicit research disclaimers regarding correlation versus causal mechanics.

### E. Smart Packaging Recommendation Rule Engine
- **Banana:** Interlocking ventilated plastic crates (400x300x250mm) with paper liners, max 5 layers high, pre-cooling at 13-14°C (DOA Circular 2021/04).
- **Pineapple:** Heavy-duty corrugated fiberboard cartons with cellular partition dividers, single-layer vertical crown-up orientation, 85-90% RH (DOA Circular 2022/01, FAO Compendium).
- **Black Pepper:** Double-walled jute bags with 50-micron food-grade polyethylene liners, moisture <= 11%, palletized storage, waterproof tarpaulins (DEA Bulletin 2019/02).

### F. Research Provenance & Dataset Limitations
- **Dataset Provenance:** The 1,200 transit records are **physically modeled synthetic prototype scenarios** based on Sri Lankan agricultural transport routes, Post-Harvest Technology Division surveys, and empirical loss factors across 15 agricultural districts.
- **Model Readiness Status:** Labeled strictly as `PROTOTYPE_SYNTHETIC` and `UNVALIDATED_FIELD_BENCHMARK`.
- **Field Validation Requirement:** In-situ supply chain sensor logging (shock accelerometers, data loggers) and independent receiver damage inspections are required before declaring field diagnostic readiness.

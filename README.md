# AgriGuard: AI-Powered Smart Agriculture Decision Support Platform

**Research Group:** J26-IT-420  
**Institution:** Sri Lanka Institute of Information Technology (SLIIT)  
**Project:** AI-Powered Smart Agriculture Platform for Minimizing Post-Harvest Crop Losses  
**Implementation Phase:** Phase 6 — Complete Backend Integration, Security Hardening and Research Validation  

---

## 1. Project Overview

AgriGuard is an integrated decision-support platform engineered to minimize post-harvest agricultural losses across Sri Lanka. The platform combines a modular monolith Node.js/Express REST backend with three Python machine learning microservices, ready for future React web and Flutter mobile applications.

### 1.1 Approved Research Scope
The research system contains **exactly three active research components**:

1. **Component 1 — AI-Based Crop Recommendation and Harvest Planning System** (`c1_crop_recommendation`)
   - Recommends crops (*Banana*, *Pineapple*, *Black Pepper*) using Random Forest classification based on soil N-P-K, pH, moisture, and agro-ecological zones.
   - Predicts crop harvest duration and optimal maturity window using Random Forest regression.
   - Live OpenWeather meteorological API integration with fallback to regional climate norms.
   - Microservice: Python FastAPI on port `8001`.

2. **Component 2 — AI-Based Plant Disease Detection and Severity Assessment System** (`c2_disease_detection`)
   - Diagnoses foliar plant diseases across Banana, Pineapple, and Black Pepper using deep learning (EfficientNet-B0 vs ResNet50 comparison).
   - Generates visual explainability heatmaps using Gradient-weighted Class Activation Mapping (Grad-CAM).
   - Enforces truthful severity availability (reports `UNAVAILABLE` when verified lesion annotations are absent).
   - Agronomically vetted management guidance grounded in Sri Lanka Department of Agriculture (DOA) bulletins.
   - Microservice: Python FastAPI on port `8002`.

3. **Component 4 — AI-Based Transportation Risk Prediction and Smart Packaging Recommendation System** (`c4_transportation_risk`)
   - Predicts transit damage probability and calibrated risk category (`LOW`, `MEDIUM`, `HIGH`) using Gradient Boosting (benchmarked against XGBoost, CatBoost, and Random Forest).
   - Explainable AI feature attribution via SHAP (`TreeExplainer`).
   - Smart packaging, handling, and storage recommendations grounded in DOA and FAO post-harvest guidelines.
   - Operates independently without requiring crop quality grading, market readiness, or shelf-life estimation.
   - Microservice: Python FastAPI on port `8003`.

> **Removed Component Note:**  
> The originally proposed Component 3 (*Harvest Quality Grading and Market Readiness Prediction*) was **formally removed** with academic supervisor approval. It is neither implemented nor required.

---

## 2. Integrated Architecture

```text
       REACT WEB (Future)                 FLUTTER MOBILE (Future)
                 \                               /
                  \                             /
                   v                           v
              ========================================
              EXPRESS BACKEND GATEWAY (Node.js Port 5000)
              - Modular Monolith Architecture
              - JWT Access / Refresh Authentication
              - Farm & Agricultural Record CRUD
              - OpenAPI 3.0 Documentation (/docs)
              - Consolidated Overview (/api/v1/farms/:id/overview)
              ========================================
                     /            |            \
                    /             |             \
                   v              v              v
             [Component 1]  [Component 2]  [Component 4]
                Crop AI        Disease AI    Transport AI
               (Port 8001)    (Port 8002)    (Port 8003)
                    \             |             /
                     \            |            /
                      v           v           v
             ========================================
             PERSISTENCE LAYER (MongoDB / Mongoose)
             - User & RefreshSession
             - Farm & AgriculturalRecord
             - CropPrediction, DiseaseAssessment, TransportationAssessment
             ========================================
```

---

## 3. Repository Structure

```text
agriguard/
├── backend/                              # Express.js REST API & Modular Monolith Gateway
│   ├── docs/
│   │   ├── architecture.md               # Backend architecture & data flow specifications
│   │   ├── client_integration_guide.md   # React & Flutter client integration guide
│   │   ├── research_validation_matrix.md # Research evidence audit & validation matrix
│   │   ├── openapi.json                  # OpenAPI 3.0 REST specification (JSON)
│   │   └── openapi.yaml                  # OpenAPI 3.0 REST specification (YAML)
│   ├── src/
│   │   ├── components/                   # Research modules (C1, C2, C4)
│   │   │   ├── c1_crop_recommendation/   # C1 routes, controllers, services, adapters
│   │   │   ├── c2_disease_detection/     # C2 routes, controllers, storage, adapters
│   │   │   └── c4_transportation_risk/   # C4 routes, controllers, services, adapters
│   │   ├── shared/                       # Auth, users, farms, records, errors, middleware
│   │   ├── config/                       # Database, env validation, CORS configuration
│   │   ├── app.js                        # Express application definition
│   │   └── server.js                     # HTTP server lifecycle & graceful shutdown
│   ├── tests/                            # Automated test suites (Jest & Supertest)
│   └── package.json
├── ml-services/                          # Independent Python Machine Learning Microservices
│   ├── c1_crop_recommendation/           # Port 8001: Random Forest Crop & Harvest ML service
│   ├── c2_disease_detection/             # Port 8002: EfficientNet-B0 Disease DL service
│   └── c4_transportation_risk/           # Port 8003: Gradient Boosting / SHAP Transport service
├── docker-compose.yml                    # Multi-container orchestration (Backend + 3 ML services)
├── start-all.ps1                         # Direct local development startup script (PowerShell)
├── start-all.sh                          # Direct local development startup script (Bash)
└── README.md                             # Repository overview
```

---

## 4. Local Development Quick Start

### Option A: Direct Local Startup (Recommended for Local Development)
Requirements: Node.js v18+ and Python 3.10+.

**Windows (PowerShell):**
```powershell
.\start-all.ps1
```

**Linux / macOS (Bash):**
```bash
chmod +x start-all.sh
./start-all.sh
```

### Option B: Docker Compose
```bash
docker compose up --build
```

### Option C: Manual Individual Service Startup
```bash
# Terminal 1: Component 1 ML Microservice
cd ml-services/c1_crop_recommendation
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001

# Terminal 2: Component 2 Deep Learning Microservice
cd ml-services/c2_disease_detection
python -m uvicorn app.main:app --host 127.0.0.1 --port 8002

# Terminal 3: Component 4 Transport Risk Microservice
cd ml-services/c4_transportation_risk
python -m uvicorn app.main:app --host 127.0.0.1 --port 8003

# Terminal 4: Node.js Express Backend
cd backend
npm install
npm run dev
```

---

## 5. API Endpoints & Documentation

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Platform discovery and supported crops | No |
| `GET` | `/api/v1` | Versioned API component discovery | No |
| `GET` | `/api/v1/health` | Centralized system health & AI readiness | No |
| `GET` | `/api/v1/health/live` | Lightweight liveness probe | No |
| `GET` | `/api/v1/health/ready` | Database readiness probe | No |
| `GET` | `/api/v1/provenance` | Research models provenance contract | No |
| `GET` | `/docs` | OpenAPI 3.0 JSON specification | No |
| `POST` | `/api/v1/auth/register` | Register new user (Farmer, Officer, Operator) | No |
| `POST` | `/api/v1/auth/login` | Authenticate and obtain JWT tokens | No |
| `POST` | `/api/v1/auth/refresh` | Rotate refresh token and obtain new access JWT | No |
| `POST` | `/api/v1/auth/logout` | Revoke active refresh session | No |
| `GET` | `/api/v1/users/me` | Retrieve authenticated user profile | Bearer JWT |
| `POST` | `/api/v1/farms` | Register agricultural farm | Bearer JWT |
| `GET` | `/api/v1/farms` | List user's farms (paginated) | Bearer JWT |
| `GET` | `/api/v1/farms/:id/overview` | Consolidated farm overview (records & AI history) | Bearer JWT |
| `POST` | `/api/v1/agricultural-records` | Submit field agronomic/soil record | Bearer JWT |
| `POST` | `/api/v1/crops/recommend` | C1 Crop recommendation inference | Bearer JWT (Opt) |
| `POST` | `/api/v1/crops/predict-harvest` | C1 Harvest window prediction | Bearer JWT (Opt) |
| `GET` | `/api/v1/crops/history` | C1 Prediction history | Bearer JWT |
| `POST` | `/api/v1/diseases/analyze` | C2 Leaf image disease classification & Grad-CAM | Bearer JWT (Opt) |
| `GET` | `/api/v1/diseases/history` | C2 Disease assessment history | Bearer JWT |
| `GET` | `/api/v1/diseases/assessments/:id` | C2 Retrieve authorized assessment | Bearer JWT |
| `GET` | `/api/v1/diseases/assessments/:id/gradcam` | C2 Retrieve Grad-CAM heatmap overlay | Bearer JWT |
| `GET` | `/api/v1/diseases/assessments/:id/image` | C2 Retrieve original leaf photograph | Bearer JWT |
| `POST` | `/api/v1/transportation/predict-risk` | C4 Transit damage probability, risk & SHAP | Bearer JWT (Opt) |
| `POST` | `/api/v1/transportation/recommend-packaging` | C4 Independent smart packaging guidelines | No |
| `GET` | `/api/v1/transportation/history` | C4 Transportation assessment history | Bearer JWT |

---

## 6. Automated Testing

### Backend Test Suite (Node.js Jest & Supertest)
```bash
cd backend
npm test
npm run test:coverage
```

### Python ML Test Suites (Pytest)
```bash
# Component 1 (Crop Recommendation & Harvest)
python -m pytest ml-services/c1_crop_recommendation/tests/

# Component 2 (Disease Detection & Grad-CAM)
python -m pytest ml-services/c2_disease_detection/tests/

# Component 4 (Transportation Risk & Smart Packaging)
python -m pytest ml-services/c4_transportation_risk/tests/
```

---

## 7. Research Documentation Links

- [Backend Architecture & Data Flow](backend/docs/architecture.md)
- [Client Integration Guide (React & Flutter)](backend/docs/client_integration_guide.md)
- [Research Validation Matrix & Evidence Audit](backend/docs/research_validation_matrix.md)
- [OpenAPI 3.0 Specification (JSON)](backend/docs/openapi.json)
- [OpenAPI 3.0 Specification (YAML)](backend/docs/openapi.yaml)
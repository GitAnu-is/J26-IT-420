# AgriGuard System Architecture Documentation

**Research Project:** AI-Powered Smart Agriculture Platform for Minimizing Post-Harvest Crop Losses  
**Research Group:** J26-IT-420  
**Institution:** Sri Lanka Institute of Information Technology (SLIIT)  
**System:** Integrated Smart Agriculture Decision Support Platform  

---

## 1. System Scope & Final Research Boundary

The AgriGuard research platform addresses post-harvest agricultural losses in Sri Lanka through an integrated decision-support system. Following supervisor approval, the platform explicitly comprises **exactly three independent research components**:

```
+---------------------------------------------------------------------------------------------------+
|                                 AgriGuard Modular Monolith Backend                                |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +---------------------------+  +---------------------------+  +-------------------------------+  |
|  |        Component 1        |  |        Component 2        |  |          Component 4          |  |
|  |    Crop Recommendation    |  |     Disease Detection     |  |      Transportation Risk      |  |
|  |    & Harvest Planning     |  |   & Severity Assessment   |  |       & Smart Packaging       |  |
|  +---------------------------+  +---------------------------+  +-------------------------------+  |
|  | • Soil N, P, K, pH, moist |  | • Image validation        |  | • Logistics parameters        |  |
|  | • Sri Lanka Agro-zones    |  | • Banana, Pineapple,      |  | • Banana, Pineapple,          |  |
|  | • Weather integration     |  |   Black Pepper            |  |   Black Pepper                |  |
|  | • Random Forest models    |  | • EfficientNet-B0/ResNet50|  | • XGBoost, CatBoost, RF       |  |
|  | • Harvest window predictor|  | • Grad-CAM visual heatmaps|  | • SHAP explainability         |  |
|  +---------------------------+  +---------------------------+  +-------------------------------+  |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
|                                     Shared Infrastructure Layer                                   |
+---------------------------------------------------------------------------------------------------+
| • MongoDB / Mongoose Connection Pooling  • Centralized Error & 404 Handling                       |
| • Standardized API Response Envelopes   • Zod Schema Validation Pipeline                          |
| • Pino Structured Logging & Redaction    • Helmet & Multi-Client CORS (React & Flutter)           |
| • JWT Authentication Foundation          • Standardized Crop Constants (BANANA, PINEAPPLE, PEPPER)|
+---------------------------------------------------------------------------------------------------+
```

> **IMPORTANT Architectural Constraint:**  
> The originally planned Component 3 (*"AI-Based Harvest Quality Grading and Market Readiness Prediction System"*) was officially removed. The platform contains **zero** dependencies, routes, models, or mock data for crop quality grading, market readiness, or shelf-life estimation.

---

## 2. Strict Component Independence & Integration Model

### Component Independence Rules:
1. **No Sequential Execution Dependency:** Component 2 does **not** require a prior Component 1 recommendation. A farmer can directly select a crop (`BANANA`, `PINEAPPLE`, or `BLACK_PEPPER`) and analyze a leaf image for diseases.
2. **Independent Logistics Analysis:** Component 4 operates independently without requiring harvest quality grades or shelf-life estimates. Farmers and logistics operators input distance, vehicle type, road condition, and crop type directly.
3. **Isolated Component Namespaces:** Each component owns its controllers, routes, services, adapters, and schemas. A failure or unavailability in one research component does not disrupt the availability of others.

### Standardized Shared Crop Entities:
All components share a single, strictly validated crop registry located in `src/shared/constants/crops.js`:
- `BANANA` (*Musa acuminata*)
- `PINEAPPLE` (*Ananas comosus*)
- `BLACK_PEPPER` (*Piper nigrum*)

---

## 3. Machine Learning Integration Architecture

Node.js Express serves as the primary API gateway, handling authentication, business logic, client compatibility, and MongoDB persistence. Machine learning models run via independent internal Python FastAPI microservices:

```
[ Web Browser (React) ]         [ Mobile App (Flutter) ]
             \                          /
              \                        /
               ▼                      ▼
        +-----------------------------------+
        |      Express.js REST Gateway      |
        |       (Authentication & CORS)     |
        +-----------------------------------+
                          |
        +-----------------+-----------------+
        |                 |                 |
        ▼                 ▼                 ▼
  [ C1 Service ]    [ C2 Service ]    [ C4 Service ]
        |                 |                 |
        |---> OpenWeather |                 |
        |---> MongoDB     |                 |
        ▼                 ▼                 ▼
  [ C1 Adapter ]    [ C2 Adapter ]    [ C4 Adapter ]
        | (HTTP / Fetch)  |                 |
        ▼                 ▼                 ▼
  +-----------+     +-----------+     +-----------+
  | Python ML |     | Python DL |     | Python ML |
  | Service 1 |     | Service 2 |     | Service 4 |
  +-----------+     +-----------+     +-----------+
  | RF Class. |     | Efficient |     | XGBoost   |
  | RF Regr.  |     | Net / Res |     | CatBoost  |
  | FastAPI   |     | Net / CAM |     | SHAP XAI  |
  +-----------+     +-----------+     +-----------+
```

### Component 1 ML Microservice (`ml-services/c1_crop_recommendation/`):
- **FastAPI HTTP Microservice (`http://127.0.0.1:8001`):** Hosts Random Forest models for crop recommendation and harvest planning.
- **Random Forest Classifier (`c1_crop_rf_v1.0.joblib`):**
  - Features: Soil chemistry (N, P, K, pH, moisture), climate factors (temperature, humidity, rainfall), district, agro-ecological zone, season.
  - Predicts suitability among: `BANANA`, `PINEAPPLE`, `BLACK_PEPPER`.
  - Generates top recommendation, calibrated confidence, and full class probability distributions.
- **Random Forest Regressor (`c1_harvest_rf_v1.0.joblib`):**
  - Features: Crop type, variety, district, season, soil pH, moisture, temperature, rainfall.
  - Predicts total harvest duration in days (`predictedDurationDays`).
  - Computes `predictedHarvestDate` (`plantingDate + predictedDurationDays`) and uncertainty harvest window (`±12 days`).
- **Express Adapter (`c1PythonInferenceAdapter.js`):**
  - Dispatches requests using native `fetch` with configurable timeout (`C1_INFERENCE_TIMEOUT_MS`).
  - Validates response schemas and propagates model versioning to database records.
  - Returns graceful `501 NOT_IMPLEMENTED` boundary when the internal microservice is offline or URL is unconfigured.
- **OpenWeather Integration (`weatherService.js`):** Enriches field queries with live meteorological data (temperature, humidity, precipitation) based on GPS coordinates or district name, with fallback to historical district baselines.

### Component 2 DL Microservice (`ml-services/c2_disease_detection/`):
- **FastAPI HTTP Microservice (`http://127.0.0.1:8002`):** Dedicated deep learning computer vision inference service for foliar disease detection, severity assessment, and visual explainability.
- **Proposed Classifier — EfficientNet-B0 (`c2_efficientnet_b0_v1.0.pt`):**
  - Architecture: Lightweight CNN with inverted residual blocks, pretrained on ImageNet and fine-tuned on foliar pathology datasets.
  - Performance: **95.00% test accuracy**, **0.9514 Macro F1**, **73.79 ms mean CPU latency**, **15.60 MB model footprint** (4.02M parameters).
  - Validated classes: 8 classes across Banana, Pineapple, and Black Pepper (Healthy and diseased states).
- **Comparison Classifier — ResNet50 (`c2_resnet50_v1.0.pt`):**
  - Architecture: Deep residual network benchmarked under identical splits and class distributions.
  - Performance: 50.00% test accuracy, 0.4141 Macro F1, 187.31 ms latency, 90.04 MB model footprint.
- **Grad-CAM Visual Explanations (`app/gradcam.py`):**
  - Computes class-discriminative gradient activations on layer `features[-1]` (EfficientNet) or `layer4[-1]` (ResNet50).
  - Blends color-mapped heatmaps onto original leaf images with alpha transparency.
  - Visual explanations are identified strictly as model decision attributions, not lesion segmentation masks.
- **Calibrated Severity Assessment (`app/severity.py`):**
  - Evaluates leaf area affliction (<15% Low, 15-40% Medium, >40% High, Healthy: NOT_APPLICABLE).
  - Enforces scientific rigor: when independent pixel lesion masks are absent, returns `severityStatus: "UNAVAILABLE"` and `severity: null` rather than fabricating estimates from Grad-CAM activation thresholds.
- **Agricultural Advisory Registry (`app/guidance.py`):**
  - Matches detected disease conditions with verified actions citing the Sri Lanka Department of Agriculture (DOA) and Department of Export Agriculture (DEA).
  - Transparently surfaces uncertainty warnings when classification confidence falls below 0.65.
- **Image Storage & Security Architecture (`services/imageStorageService.js`):**
  - Validates image magic bytes (`FF D8 FF` JPEG, `89 50 4E 47` PNG, `52 49 46 46` WebP).
  - Enforces 8 MB size limits and rejects extension spoofing and decompression bombs.
  - Generates cryptographically secure random storage keys (`img_<uuid>.<ext>`).
  - Private filesystem / object storage with authorized streaming endpoints (`GET /assessments/:id/gradcam`, `GET /assessments/:id/image`).
  - Automatic cleanup of uploaded artifacts upon inference failures.

### Component 4 ML Microservice (`ml-services/c4_transportation_risk/`):
- **FastAPI HTTP Microservice (`http://127.0.0.1:8003`):** Internal machine learning and smart packaging service for transit damage probability, categorical risk classification, and SHAP explainability.
- **Candidate Algorithms Evaluated:**
  - Baseline Dummy Classifier (Zero-Rule / Stratified)
  - Random Forest Classifier (`n_estimators=100, max_depth=10, class_weight='balanced'`)
  - XGBoost Classifier (`n_estimators=100, max_depth=6, learning_rate=0.1`)
  - CatBoost Classifier (`iterations=150, depth=6, learning_rate=0.1`)
  - Gradient Boosting Classifier (`n_estimators=100, max_depth=5, learning_rate=0.1`)
- **Selected Risk Model:** Gradient Boosting Classifier delivering **85.83% test accuracy**, **0.8452 Macro F1**, **0.0958 Brier score**, and **0.008 ms/sample inference latency** with a compact 362 KB disk footprint, alongside XGBoost (**86.67% test accuracy**, **0.8535 Macro F1**).
- **Engineered Transit Features:**
  - `travel_speed_kmh = distance_km / duration_hours` (Identifies speed anomalies, mechanical shock risks, or heavy traffic).
  - `thermal_stress_index`: Non-linear function capturing thermal and humidity deviation from crop-specific optimal storage thresholds.
- **Calibrated Risk Policy:**
  - `LOW`: Damage probability < 0.25 (Safe transit conditions).
  - `MEDIUM`: Damage probability 0.25 - 0.65 (Moderate transit risk; requires packaging or route precautions).
  - `HIGH`: Damage probability > 0.65 (Critical transit risk; requires immediate intervention or climate-controlled transport).
- **SHAP Explainable AI (`app/explanations.py`):**
  - Utilizes `shap.TreeExplainer` on the selected gradient boosted tree ensemble.
  - Computes exact Shapley values for all transformed input features.
  - Separates features into primary risk-elevating factors (positive SHAP contributions) and risk-mitigating factors (negative SHAP contributions).
- **Smart Packaging Recommendation Engine (`app/recommendations.py`):**
  - Crop-specific, evidence-backed agronomic packaging rules citing the Sri Lanka Department of Agriculture (DOA), Department of Export Agriculture (DEA), and FAO Post-Harvest Compendium.
  - Operates completely independently of risk prediction model availability.
- **Express Adapter (`c4PythonInferenceAdapter.js`):**
  - Communicates over internal HTTP with `X-Internal-Service-Key` mutual header authentication.
  - Enforces configurable timeout (`C4_INFERENCE_TIMEOUT_MS`, default 15s).
  - Translates microservice errors into standardized Express AppErrors (501, 503, 400).

---

## 4. Multi-Client Compatibility Matrix

| Client | Connection Protocol | CORS / Origin Behavior | Target API Base URL |
| :--- | :--- | :--- | :--- |
| **React Web** (Local) | HTTP / Fetch / Axios | Sends `Origin: http://localhost:5173` (Validated against allowed origins) | `http://localhost:5000/api/v1` |
| **Flutter Android Emulator** | HTTP / Dart `http` / Dio | No browser `Origin` header (Allowed by CORS fallback) | `http://10.0.2.2:5000/api/v1` |
| **Flutter Physical Device** | HTTP / Dart `http` / Dio | No browser `Origin` header (Allowed by CORS fallback) | `http://<LAN_IP>:5000/api/v1` (e.g. `http://192.168.1.50:5000/api/v1`) |
| **Future Production Server** | HTTPS / WSS | Validated against production domain whitelist | `https://api.agriguard.sliit.lk/api/v1` |

---

## 5. Security Architecture
1. **Helmet:** Enforces standard secure HTTP headers (XSS Protection, Frameguard, MIME Sniffing prevention, Strict Transport Security).
2. **CORS:** Multi-origin whitelist supporting both browser single-page applications and mobile app runtimes.
3. **Payload Sanitization:** Express body parser configured with strict byte limit (`10mb`) to prevent memory exhaustion attacks.
4. **Structured Error Masking:** Production responses suppress stack traces and system internals, returning predictable JSON error schemas with machine-readable codes.
5. **PII and Secret Redaction:** Structured Pino logger automatically redacts authorization headers, database passwords, tokens, and API keys.
6. **NoSQL Injection Resistance:** Mongoose schema sanitization and strict Zod validation reject arbitrary query objects (`$gt`, `$where`, etc.).
7. **Rate Limiting:** IP-based login rate limiting guards authentication routes against brute-force attacks.

---

## 6. Authentication & Session Architecture

### JWT Dual-Token Lifecycle
AgriGuard implements a stateless access token paired with a stateful, rotated refresh token:

```
[ Client ]                            [ Express Gateway ]                        [ MongoDB ]
    |                                          |                                      |
    |---- POST /auth/login ------------------->|                                      |
    |     { email, password }                  |---- Verify bcrypt hash ------------->|
    |                                          |                                      |
    |<--- 200 OK ------------------------------|---- Store SHA-256 session hash ----->|
    |     { accessToken (15m),                 |     with familyId and expiry         |
    |       refreshToken (7d) }                |                                      |
    |                                          |                                      |
    |---- (Protected API calls with Bearer) -->|                                      |
    |                                          |                                      |
    |-- (Access token expired - 401 received) -|                                      |
    |                                          |                                      |
    |---- POST /auth/refresh ----------------->|                                      |
    |     { refreshToken }                     |---- Look up session by tokenHash --->|
    |                                          |---- Detect reuse / revocation ------>|
    |                                          |---- Revoke old session & issue new ->|
    |<--- 200 OK ------------------------------|                                      |
          { accessToken, refreshToken }
```

### Refresh Token Rotation & Replay Protection
1. **Cryptographic Hash Storage:** Raw refresh tokens are never persisted in plaintext. Only their SHA-256 digests (`tokenHash`) are stored in `RefreshSession`.
2. **Session Families:** Each session belongs to a `familyId`. When a refresh token is exchanged, it is marked as `isRevoked: true` and replaced with a new token in the same family.
3. **Replay Detection & Auto-Revocation:** If an already-revoked refresh token is presented again (indicating token compromise or replay attack), the backend instantly invalidates **all** active sessions in that `familyId`, neutralizing the attacker.
4. **Password Invalidation:** When a user changes their password, `passwordChangedAt` is updated and all active refresh sessions are revoked immediately (`logoutAll`).

---

## 7. Role-Based Access Control (RBAC) & Ownership Security Model

### User Roles Matrix
| Role | Platform Capabilities | Cross-Component Access |
| :--- | :--- | :--- |
| `FARMER` | Manages own profile, owns farms and field records, runs C1, C2, C4 predictions, views own history. | Full access to own data across all 3 AI components. Cannot view other farmers' data. |
| `AGRICULTURAL_OFFICER` | Reviews agronomic field records and advisory reports when authorized. | Read-only inspection of permitted farms; access to C1 & C2 recommendation engines. |
| `TRANSPORT_OPERATOR` | Manages transport vehicle logistics, shipment risk assessments (C4). | Access to C4 transportation risk engine; cannot access unrelated farm records. |
| `ADMIN` | System administration, user deactivation, platform auditing. | Internal management; prohibited from public self-registration. |

### Ownership Enforcement
All resource mutations and private retrievals verify `resource.ownerId.toString() === req.user.id`. Client-supplied IDs in request bodies are ignored in favor of the cryptographically signed `req.user.id`.

---

## 8. Database Collections & Schema Architecture

```
+---------------------------------------------------------------------------------------------------+
|                                       MongoDB Database                                            |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +--------------------+         1:N         +--------------------+         1:N                    |
|  |       users        |-------------------->|   refresh_sessions |                                |
|  +--------------------+                     +--------------------+                                |
|  | _id (ObjectId)     |                     | _id (ObjectId)     |                                |
|  | email (unique, idx)|                     | userId (ref: User) |                                |
|  | passwordHash (hide)|                     | tokenHash (SHA-256)|                                |
|  | role (enum)        |                     | familyId (UUID)    |                                |
|  | isActive (bool)    |                     | isRevoked (bool)   |                                |
|  | passwordChangedAt  |                     | expiresAt (TTL idx)|                                |
|  +--------------------+                     +--------------------+                                |
|           |                                                                                       |
|           | 1:N                                                                                   |
|           v                                                                                       |
|  +--------------------+         1:N         +----------------------+                              |
|  |       farms        |-------------------->| agricultural_records |                              |
|  +--------------------+                     +----------------------+                              |
|  | _id (ObjectId)     |                     | _id (ObjectId)       |                              |
|  | ownerId (ref: User)|                     | ownerId (ref: User)  |                              |
|  | farmName           |                     | farmId (ref: Farm)   |                              |
|  | district           |                     | cropType (enum)      |                              |
|  | agroEcologicalZone |                     | plantingDate (Date)  |                              |
|  | soilType           |                     | soilPh, N, P, K      |                              |
|  | area, areaUnit     |                     | soilMoisture         |                              |
|  | supportedCrops[]   |                     +----------------------+                              |
|  | isArchived (soft)  |                                                                           |
|  +--------------------+                                                                           |
|           |                                                                                       |
|           +-------------------------------+-------------------------------+                       |
|           | 1:N (optional farmId ref)     | 1:N (optional farmId ref)     | 1:N                   |
|           v                               v                               v                       |
|  +--------------------+         +--------------------+         +-------------------------------+  |
|  |  crop_predictions  |         | disease_assessments|         |  transportation_assessments   |  |
|  |        (C1)        |         |        (C2)        |         |             (C4)              |  |
|  +--------------------+         +--------------------+         +-------------------------------+  |
|  | userId (ref: User) |         | userId (ref: User) |         | userId (ref: User)            |  |
|  | farmId (ref: Farm) |         | farmId (ref: Farm) |         | farmId (ref: Farm)            |  |
|  | soilInput {N,P,K}  |         | cropType (enum)    |         | cropType (enum)               |  |
|  | recommendedCrop    |         | imageKey / URL     |         | transitDetails {km, hrs, road}|  |
|  | predictedHarvest   |         | predictedDisease   |         | predictedDamageProbability    |  |
|  | modelVersion       |         | severity, Grad-CAM |         | riskLevel (LOW/MED/HIGH)      |  |
|  | createdAt          |         | modelVersion       |         | packagingRecommendations      |  |
|  +--------------------+         +--------------------+         +-------------------------------+  |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

---

## 9. Multi-Client Security & Token Integration

### React Web Client
- **Access Token:** Stored in application memory (React Context / Redux state) to eliminate XSS persistence vulnerabilities.
- **Refresh Token:** Stored in a secure, `HttpOnly`, `SameSite=Strict` cookie or retrieved securely via authentication service.
- **Axios Interceptor:** Intercepts outgoing requests to attach `Authorization: Bearer <accessToken>`. On `401 Unauthorized`, pauses queue, calls `POST /api/v1/auth/refresh`, updates the in-memory token, and replays failed requests.

### Flutter Mobile Client
- **Access & Refresh Tokens:** Stored using `flutter_secure_storage` (backed by **Android KeyStore** and **iOS Keychain** with hardware encryption).
- **Network Interceptor:** Dio interceptor checks token expiry locally before sending requests, automatically invoking `POST /api/v1/auth/refresh` on background thread if needed.
- **Biometric Authentication:** Mobile clients can protect the secure storage unlock with device biometric authentication (Fingerprint / Face ID).

---

## 10. Phase 6 Integrated Endpoints, Health & Research Provenance

### 10.1 Consolidated Agricultural Workspace Overview
- **Endpoint:** `GET /api/v1/farms/:id/overview`
- **Purpose:** Enables React and Flutter client dashboards to retrieve a unified snapshot of the farm, its agricultural records, and the latest research assessment outcomes from Component 1, Component 2, and Component 4 in a single authorized call.
- **Independence & Safety:** Does not trigger expensive AI inference during overview rendering. Returns explicit `NO_RECORDS` statuses when historical assessments are absent.

### 10.2 Centralized System Health, Liveness & Readiness Probes
- **Full Health Check:** `GET /api/v1/health` and `GET /health`  
  Returns comprehensive system status, memory utilization, database connectivity, and non-blocking bounded-time checks of internal Python microservices.
- **Liveness Probe:** `GET /health/live` and `GET /api/v1/health/live`  
  Lightweight endpoint returning HTTP 200 immediately for container orchestrators (Kubernetes / Docker).
- **Readiness Probe:** `GET /health/ready` and `GET /api/v1/health/ready`  
  Validates that database connections are established before routing traffic.

### 10.3 Standardized Research Model Provenance Contract
- **Endpoint:** `GET /api/v1/provenance`
- **Purpose:** Publicly discloses dataset provenance, evaluation splits, and research limitations across all components without fabricating clinical or field claims.
- **Validation Taxonomy:** `UNAVAILABLE`, `PROTOTYPE_SYNTHETIC`, `INTERNALLY_EVALUATED`, `EXTERNALLY_VALIDATED`.

### 10.4 API Documentation Specification
- **OpenAPI 3.0 Specification:** Exposed at `GET /docs` and `GET /docs/openapi.json`.
- **Specification Files:** Available in `backend/docs/openapi.json` and `backend/docs/openapi.yaml`.


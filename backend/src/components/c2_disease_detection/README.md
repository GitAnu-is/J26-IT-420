# Component 2: AI-Based Plant Disease Detection and Severity Assessment System

**Research Group:** J26-IT-420  
**Institution:** Sri Lanka Institute of Information Technology (SLIIT)  
**Research Component:** C2 — Plant Disease Detection, Severity Assessment & Explainability  
**Layer:** Express Backend Integration & Python Deep Learning Microservice  

---

## 1. Component Overview

Component 2 provides an end-to-end computer vision and deep learning service for detecting foliar plant diseases, evaluating visible disease severity, and generating visual attributions (Grad-CAM) across smallholder farms in Sri Lanka.

### Supported Cultivars
1. **Banana** (*Musa acuminata*)
2. **Pineapple** (*Ananas comosus*)
3. **Black Pepper** (*Piper nigrum*)

---

## 2. Supported Disease Classes & Agronomic Provenance

The disease class registry strictly reflects verified pathological conditions documented by the Sri Lanka Department of Agriculture (DOA) and Department of Export Agriculture (DEA):

| Class Identifier | Crop | Disease / Condition | Pathological Agent |
| :--- | :--- | :--- | :--- |
| `BANANA___HEALTHY` | Banana | Asymptomatic Foliage | None |
| `BANANA___SIGATOKA` | Banana | Sigatoka Leaf Spot | *Pseudocercospora fijiensis* / *musae* |
| `BANANA___BUNCHY_TOP` | Banana | Banana Bunchy Top Virus (BBTV) | Banana bunchy top virus (Babahuwa) |
| `PINEAPPLE___HEALTHY` | Pineapple | Asymptomatic Crown & Leaves | None |
| `PINEAPPLE___HEART_ROT` | Pineapple | Heart Rot / Top Rot | *Phytophthora nicotianae* var. *parasitica* |
| `BLACK_PEPPER___HEALTHY` | Black Pepper | Asymptomatic Foliage & Spikes | None |
| `BLACK_PEPPER___QUICK_WILT` | Black Pepper | Quick Wilt / Foot Rot | *Phytophthora capsici* |
| `BLACK_PEPPER___POLLU_DISEASE` | Black Pepper | Pollu Disease / Anthracnose | *Colletotrichum gloeosporioides* |

---

## 3. System Architecture & Request Lifecycle

```text
React Web / Flutter Mobile Client
               │
               ▼  (POST /api/v1/diseases/analyze with multipart/form-data)
       Express REST API Gateway
               │
               ├─► File Validation & Magic Bytes Header Check (JPEG, PNG, WebP <= 8MB)
               ├─► Secure Cryptographic Storage Key (prevent path traversal)
               ├─► Farm & Agricultural Record Ownership Verification
               │
               ▼  (Internal HTTP + X-Internal-Service-Key)
    FastAPI Inference Microservice (Port 8002)
               │
               ├─► EXIF Transposition & RGB Conversion
               ├─► ImageNet Normalization: mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
               ├─► EfficientNet-B0 Forward Pass (Input: 1x3x224x224 -> Output: 1x8 Logits)
               ├─► Crop-Disease Consistency Routing & Mismatch Flagging
               ├─► Severity Evaluation (Explicitly UNAVAILABLE without validated lesion masks)
               ├─► Grad-CAM Visual Heatmap Generation (hooks on features[-1])
               ├─► Validated Management Guidance Lookup (DOA / DEA citations)
               │
               ▼  (JSON response + base64 Grad-CAM overlay)
       Express Service Layer
               │
               ├─► Save Grad-CAM artifact to uploads/c2_diseases/gradcam/
               ├─► Persist validated DiseaseAssessment in MongoDB (for authenticated user)
               │
               ▼  (JSON Response: HTTP 200)
Client Application (Displays classification, severity, guidance & Grad-CAM)
```

---

## 4. REST API Specification

### 4.1 Module Discovery
- **Endpoint:** `GET /api/v1/diseases`
- **Auth:** Optional
- **Response:**
```json
{
  "success": true,
  "data": {
    "componentId": "C2",
    "status": "active",
    "supportedCrops": ["BANANA", "PINEAPPLE", "BLACK_PEPPER"],
    "models": {
      "proposed": "EfficientNet-B0 (Transfer Learning)",
      "comparison": "ResNet50 (Transfer Learning)",
      "explainability": "Grad-CAM Visual Heatmap Generation"
    }
  }
}
```

### 4.2 Analyze Plant Image
- **Endpoint:** `POST /api/v1/diseases/analyze`
- **Content-Type:** `multipart/form-data` or `application/json`
- **Fields:**
  - `image` *(File, optional if imageBase64 provided)*: Plant leaf photo (JPEG/PNG/WebP, <= 8MB)
  - `crop` or `cropType` *(String, Required)*: `BANANA`, `PINEAPPLE`, or `BLACK_PEPPER`
  - `farmId` *(String, Optional)*: MongoDB ObjectId of user's farm
  - `agriculturalRecordId` *(String, Optional)*: Associated agricultural record ObjectId
  - `imageBase64` *(String, Optional)*: Raw Base64 data string (alternative to file)
- **Response Example:**
```json
{
  "success": true,
  "message": "Disease analysis completed successfully",
  "data": {
    "cropType": "BANANA",
    "predictedDisease": "BANANA___SIGATOKA",
    "diseaseNameDisplay": "Sigatoka Leaf Spot (Pseudocercospora spp.)",
    "confidence": 0.945,
    "classProbabilities": {
      "BANANA___SIGATOKA": 0.945,
      "BANANA___HEALTHY": 0.055
    },
    "severity": null,
    "severityStatus": "UNAVAILABLE",
    "severityMethod": "Requires independent expert-annotated lesion segmentation masks. In accordance with research integrity standards, severity is not inferred from raw Grad-CAM heatmaps.",
    "imageReference": "plant_1771360000000_a1b2c3d4e5f6.jpg",
    "gradCamArtifactReference": "gradcam_plant_1771360000000_f7e8d9c0.png",
    "managementGuidance": [
      "Deleaf and prune necrotic leaves displaying active sporulating lesions; safely burn or bury debris outside the plantation to destroy ascospore inoculum.",
      "Improve field drainage and widen sucker spacing to increase aeration and lower relative humidity beneath the canopy."
    ],
    "guidanceCitation": "Department of Agriculture Sri Lanka - Circular on Black & Yellow Sigatoka Management (Pseudocercospora fijiensis/musae), Peradeniya.",
    "modelIdentifier": "c2_efficientnet_b0",
    "modelVersion": "v1.0",
    "predictionStatus": "COMPLETED",
    "executionLatencyMs": 73.8,
    "savedAssessmentId": "67b4f1234567890abcdef123"
  }
}
```

### 4.3 Assessment History
- **Endpoint:** `GET /api/v1/diseases/history?page=1&limit=10&cropType=BANANA`
- **Auth:** Bearer Token Required (Farmer / Officer)
- **Filters:** `cropType`, `severity`, `disease`, `page`, `limit`

### 4.4 Authorized Grad-CAM Artifact Retrieval
- **Endpoint:** `GET /api/v1/diseases/assessments/:id/gradcam`
- **Auth:** Bearer Token Required (Assessment Owner or Admin)
- **Response:** Raw PNG image stream with Grad-CAM heatmap blended over original image.

---

## 5. Research Methodology & Severity Assessment Rigor

### Scientific Restriction on Severity
In strict compliance with academic computer vision standards:
1. **Grad-CAM is an attribution visualization**, not a calibrated lesion segmentation mask.
2. The system **strictly forbids computing disease severity percentages directly from raw Grad-CAM activation thresholds**.
3. When validated lesion segmentation masks or expert multi-class severity annotations are absent, the system explicitly returns `severityStatus: "UNAVAILABLE"` and `severity: null`.
4. Healthy plants are strictly categorized as `severity: "HEALTHY"` and `severityStatus: "NOT_APPLICABLE"` (severity 0.0).

---

## 6. Deep Learning Evaluation Summary

Evaluated on the held-out test partition (stratified 10% test split, zero data leakage):

| Architecture | Test Accuracy | Macro F1 | Weighted F1 | Mean Latency (CPU) | Checkpoint Footprint |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **EfficientNet-B0 (Proposed)** | **95.00%** | **0.9514** | **0.9514** | **73.79 ms** | **15.60 MB** |
| **ResNet50 (Comparison)** | 50.00% | 0.4141 | 0.4141 | 187.31 ms | 90.04 MB |

**Architectural Conclusion:** EfficientNet-B0 provides 5.7x smaller parameter footprint, 2.5x lower CPU inference latency, and significantly higher classification generalization, confirming its selection as the primary production model.

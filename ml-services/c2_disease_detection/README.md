# AgriGuard Component 2 Deep Learning Inference Service

**Research Project:** AI-Powered Smart Agriculture Platform (SLIIT J26-IT-420)  
**Component:** C2 — AI-Based Plant Disease Detection & Severity Assessment System  
**Framework:** PyTorch, Torchvision, OpenCV, Pillow, FastAPI, Pydantic  

---

## 1. Overview

This microservice provides deep learning computer vision inference for Component 2:
1. **Primary Proposed Classifier (`c2_efficientnet_b0_v1.0.pt`):** EfficientNet-B0 transfer learning architecture trained on validated pathological foliar symptoms for Banana, Pineapple, and Black Pepper.
2. **Comparison Classifier (`c2_resnet50_v1.0.pt`):** ResNet50 transfer learning architecture trained under the identical split and class registry for architectural benchmarking.
3. **Grad-CAM Visual Explainer:** Computes class-specific convolutional activation maps on layer `features[-1]` (EfficientNet) or `layer4[-1]` (ResNet50) with bicubic overlay and alpha blending.
4. **Calibrated Severity Evaluator:** Evaluates visible severity from verified segmentation masks or explicitly returns `UNAVAILABLE` where masks lack independent validation.
5. **Validated Management Guidance Registry:** Provides evidence-based disease treatment actions citing Sri Lanka Department of Agriculture (DOA) and Department of Export Agriculture (DEA) publications.

---

## 2. Supported Crops and Validated Disease Classes

| Class Index | Class Identifier | Crop | Disease Display Name |
| :---: | :--- | :--- | :--- |
| 0 | `BANANA___BUNCHY_TOP` | Banana | Banana Bunchy Top Virus (BBTV) |
| 1 | `BANANA___HEALTHY` | Banana | Healthy Foliage |
| 2 | `BANANA___SIGATOKA` | Banana | Sigatoka Leaf Spot (*Pseudocercospora spp.*) |
| 3 | `BLACK_PEPPER___HEALTHY` | Black Pepper | Healthy Foliage & Spikes |
| 4 | `BLACK_PEPPER___POLLU_DISEASE` | Black Pepper | Pollu Disease / Anthracnose (*C. gloeosporioides*) |
| 5 | `BLACK_PEPPER___QUICK_WILT` | Black Pepper | Quick Wilt / Foot Rot (*Phytophthora capsici*) |
| 6 | `PINEAPPLE___HEALTHY` | Pineapple | Healthy Foliage |
| 7 | `PINEAPPLE___HEART_ROT` | Pineapple | Heart Rot / Top Rot (*Phytophthora nicotianae*) |

---

## 3. Deep Learning Architecture Comparison & Evaluation

Evaluated on the held-out test partition (stratified 10% test split, zero data leakage):

| Metric | EfficientNet-B0 (Proposed) | ResNet50 (Comparison) |
| :--- | :---: | :---: |
| **Test Accuracy** | **95.00%** | 50.00% |
| **Macro Precision** | **0.9643** | 0.4479 |
| **Macro Recall** | **0.9500** | 0.5000 |
| **Macro F1-Score** | **0.9514** | 0.4141 |
| **Weighted F1-Score** | **0.9514** | 0.4141 |
| **Mean CPU Latency** | **73.79 ms** | 187.31 ms |
| **Model Disk Size** | **15.60 MB** | 90.04 MB |
| **Total Parameters** | **4,017,796** | 23,524,424 |

**Model Selection:** EfficientNet-B0 is confirmed as the primary production model due to its 5.7x smaller memory footprint, 2.5x faster inference, and superior generalization on plant disease foliar symptoms.

---

## 4. Severity Assessment Methodology & Limitations

- **Low / Medium / High Rules:**
  - `LOW`: < 15% visible affected leaf area.
  - `MEDIUM`: 15% - 40% visible affected leaf area.
  - `HIGH`: > 40% visible affected leaf area or apical meristem necrosis.
  - `HEALTHY`: Healthy foliage baseline (0.0% severity).
- **Research Integrity Standard:** Grad-CAM heatmaps represent convolutional network gradient attribution, **not pixel-precise lesion masks**. The system strictly forbids calculating severity percentages from raw Grad-CAM activation thresholds.
- When independent verified lesion segmentation masks or expert multi-class annotations are unavailable, severity is transparently returned as `severity: null` and `severityStatus: "UNAVAILABLE"`.

---

## 5. Quick Setup & Execution

### 5.1 Install Dependencies
```bash
pip install -r requirements.txt
```

### 5.2 Prepare Dataset
```bash
python training/prepare_dataset.py
```

### 5.3 Train Models
```bash
python training/train_efficientnet.py
python training/train_resnet.py
```

### 5.4 Evaluate Models on Test Set
```bash
python training/evaluate_models.py
```

### 5.5 Run Automated Test Suite
```bash
python -m pytest tests/
```

### 5.6 Start FastAPI Microservice
```bash
python app/main.py
```
*(Binds to `http://127.0.0.1:8002` by default).*

---

## 6. Internal API Endpoints

- `GET /health` — Microservice health, loaded models, and device status.
- `GET /model-info` — Model architectures, classes, versioning, and evaluation metrics.
- `POST /predict/disease` — Multipart form inference accepting image file and target crop.
- `POST /predict/disease-json` — JSON inference accepting Base64 image payload.

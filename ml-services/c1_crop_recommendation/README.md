# AgriGuard Component 1 Machine Learning Service

**Research Project:** AI-Powered Smart Agriculture Platform (SLIIT J26-IT-420)  
**Component:** C1 — AI-Based Crop Recommendation and Harvest Planning System  
**Framework:** FastAPI, scikit-learn, joblib, Pydantic  

---

## 1. Overview

This microservice provides internal machine-learning inference for Component 1:
1. **Random Forest Classifier (`c1_crop_rf_v1.0.joblib`):** Recommends the optimal crop (`BANANA`, `PINEAPPLE`, `BLACK_PEPPER`) based on soil chemistry (N, P, K, pH, moisture), climate factors (temperature, humidity, rainfall), and agro-ecological zones.
2. **Random Forest Regressor (`c1_harvest_rf_v1.0.joblib`):** Predicts harvest duration in days and practical harvest windows based on planting date / biological reference date, crop variety, and environmental context.

---

## 2. Scientific Provenance & Dataset Classification

### 2.1 Dataset Category
The training and evaluation datasets (`c1_crop_recommendation.csv` and `c1_harvest_prediction.csv`) contain 2,400 records each.
- **Classification:** **Agronomically Modeled Synthetic Agricultural Data**.
- **Provenance:** Generated programmatically by parameterizing expert agronomic recommendations, soil suitability envelopes, and district-level climatic profiles published by the Sri Lanka Department of Agriculture (DOA) and Department of Export Agriculture (DEA).
- **Important Disclosure:** These records are **NOT empirical in-situ farm sensor observations** collected from Sri Lankan farms. They serve as prototype training artifacts for software architecture and algorithmic feasibility validation.
- **Field Generalization Limitation:** Reported test metrics (e.g. 98.12% accuracy on the classifier, R² 0.9875 across pooled crops on the regressor) evaluate model behavior on held-out synthetic partitions conforming to the generating distributions. They must not be conflated with field-validated generalization.

### 2.2 Biological Reference Events for Harvest Duration
Harvest duration targets are biological events with distinct crop-specific starting points:
- **BANANA:** Reference starting event is **planting of healthy suckers or tissue-culture plantlets** to bunch harvest maturity (nominal duration 270–365 days; mean ~315 days).
- **PINEAPPLE:** Reference starting event is **planting of healthy slips/suckers** to first fruit harvest (nominal duration 420–540 days; mean ~480 days).
- **BLACK_PEPPER:** Reference starting event is **post-monsoon annual reproductive spike emergence / flowering initiation** to berry harvest (nominal duration 210–270 days; mean ~240 days). *Note: Black Pepper is a perennial vine; initial vine establishment requires 3–4 years before first commercial bearing; the annual harvest duration model specifically tracks the reproductive cycle from spike emergence.*

### 2.3 Uncertainty Bounds & Margin Calibration
- The predicted harvest window uses a nominal margin of **±12 days**.
- **Scientific Basis:** This margin was derived directly from the overall test Root Mean Squared Error (RMSE = 11.74 days), representing an **empirical 1-sigma root-mean-squared error band** under the synthetic distribution.
- **Limitation:** It is **NOT a formally calibrated 95% conformal prediction interval**. Per-crop RMSE varies (Banana: 10.18 days; Pineapple: 15.33 days; Black Pepper: 8.64 days). In production, conformalized quantile regression using held-out empirical farm records is required to guarantee statistical coverage.

---

## 3. Real-Data Field Validation Plan

To transition Component 1 from prototype to field-validated research:
1. **In-situ Soil Sensor Network:** Deploy calibrated IoT soil sensors (NPK, pH, capacitive soil moisture) across representative agro-ecological zones:
   - Wet Zone: Gampaha (WL2a), Colombo (WL1a), Kalutara (WL1b), Kegalle (WL1a).
   - Intermediate Zone: Kurunegala (IL1a), Matale (WM1b), Kandy (WM1a).
   - Dry Zone: Hambantota (DL1b).
2. **Phenological Observation Tracking:** Partner with Agricultural Research and Production Assistants (ARPA) and Department of Agriculture officers to record exact phenological dates (planting, spike emergence, flowering, color break, harvest) across smallholder farms.
3. **External Generalization Testing:** Benchmark models on independent farm records across differing monsoon seasons (Yala vs. Maha) to assess climate resilience and domain shift.

---

## 4. Quick Setup & Execution

### Install Dependencies
```bash
python -m pip install -r requirements.txt
```

### Prepare Dataset
```bash
python training/prepare_dataset.py
```

### Train & Evaluate Models
```bash
python training/train_crop_model.py
python training/train_harvest_model.py
python training/evaluate_models.py
```

### Run Tests
```bash
python -m pytest tests/
```

### Start ML Inference Microservice
```bash
python app/main.py
```
*(Runs on `http://127.0.0.1:8001` by default).*

---

## 5. API Endpoints

- `GET /health` — Service readiness and loaded models status.
- `GET /model-info` — Metadata, versioning, and test evaluation metrics.
- `POST /predict/crop` — Crop suitability classification and probability distribution.
- `POST /predict/harvest` — Expected harvest duration in days, harvest date, and uncertainty window.

# AgriGuard Component 4 Machine Learning Microservice

**Research Project:** AI-Powered Smart Agriculture Platform (SLIIT J26-IT-420)  
**Component:** C4 — AI-Based Transportation Risk Prediction and Smart Packaging Recommendation System  
**Framework:** Python, FastAPI, Scikit-learn, XGBoost, CatBoost, SHAP, Pandas, NumPy  

---

## 1. Overview

Component 4 evaluates agricultural logistics journeys to estimate the probability of post-harvest transit damage and generate actionable packaging, storage, and handling recommendations. It functions completely independently without relying on produce quality grading or shelf-life models.

Key Capabilities:
1. **Multi-Model Machine Learning Benchmark:** Evaluates 4 candidate algorithms (Random Forest, XGBoost, CatBoost, Gradient Boosting) against a majority baseline on Sri Lankan agricultural transit parameters.
2. **Transportation Damage Probability:** Generates calibrated damage probabilities ($P \in [0, 1]$) and maps them to risk categories (Low, Medium, High).
3. **SHAP Explainable AI:** Leverages TreeExplainer to produce local feature attributions identifying top risk-increasing and risk-mitigating transit factors.
4. **Smart Packaging Recommendation Engine:** Generates crop-specific packaging, cushioning, storage, and transportation guidance citing Sri Lanka Department of Agriculture (DOA), Department of Export Agriculture (DEA), and FAO guidelines.
5. **Internal FastAPI Service:** Serves authenticated predictions over an internal microservice interface on port 8003.

---

## 2. Supported Crops and Logistics Parameters

- **Supported Crops:** `BANANA`, `PINEAPPLE`, `BLACK_PEPPER`
- **Vehicle Types:** `OPEN_TRUCK`, `COVERED_TRUCK`, `REFRIGERATED_TRUCK`, `THREE_WHEELER`, `PICKUP`, `TRACTOR_TRAILER`
- **Packaging Types:** `WOODEN_CRATES`, `PLASTIC_CRATES`, `CORRUGATED_BOXES`, `GUNNY_BAGS`, `JUTE_BAGS`, `LOOSE_BULK`, `POLYETHYLENE_LINED_BAGS`
- **Road Conditions:** `PAVED_GOOD`, `PAVED_POOR`, `UNPAVED_ROUGH`, `MIXED`
- **Environmental Parameters:** Ambient temperature (°C), relative humidity (%)

---

## 3. Candidate Algorithm Comparison & Evaluation

Evaluated on the held-out test partition (120 untouched samples, zero data leakage):

| Model | Test Accuracy | Macro Precision | Macro Recall | Macro F1 | Brier Score | ROC-AUC | CPU Latency | Disk Size |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline (Dummy)** | 61.67% | 0.3083 | 0.5000 | 0.3814 | 0.2384 | 0.5000 | <0.001 ms | 0.57 KB |
| **Random Forest** | 81.67% | 0.8257 | 0.8037 | 0.8061 | 0.1241 | 0.9136 | 0.236 ms | 2,304 KB |
| **XGBoost** | **86.67%** | **0.8655** | **0.8504** | **0.8535** | **0.0997** | **0.9465** | **0.020 ms** | **281 KB** |
| **CatBoost** | 84.17% | 0.8441 | 0.8236 | 0.8269 | 0.1008 | 0.9415 | 0.017 ms | 124 KB |
| **Gradient Boosting** | 85.83% | 0.8665 | 0.8383 | 0.8452 | 0.0958 | 0.9492 | 0.008 ms | 362 KB |

**Selected Model:** Gradient Boosting / XGBoost offer superior calibration (Brier score < 0.10) and low inference latency (<0.02 ms/sample).

---

## 4. SHAP Explainability & Risk Categorization

- **Risk Categories:**
  - `LOW`: $P(\text{damage}) < 0.25$
  - `MEDIUM`: $0.25 \le P(\text{damage}) \le 0.65$
  - `HIGH`: $P(\text{damage}) > 0.65$
- **SHAP Feature Attributions:** Decomposes risk predictions into primary risk elevators (e.g. unpaved rough roads, open trucks, high temperatures) and risk mitigators (e.g. plastic crates, refrigeration, paved highways).

---

## 5. Quick Setup & Execution

### 5.1 Install Dependencies
```bash
pip install -r requirements.txt
```

### 5.2 Generate Dataset
```bash
python training/prepare_dataset.py
```

### 5.3 Train Candidate Models
```bash
python training/train_models.py
```

### 5.4 Evaluate on Held-Out Test Set
```bash
python training/evaluate_models.py
```

### 5.5 Run Automated Pytest Suite
```bash
python -m pytest tests/
```

### 5.6 Start FastAPI Microservice
```bash
python app/main.py
```
*(Binds to `http://127.0.0.1:8003` by default).*

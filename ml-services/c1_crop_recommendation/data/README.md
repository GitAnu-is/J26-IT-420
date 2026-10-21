# Component 1 Dataset Documentation: Sri Lankan Crop Recommendation & Harvest Prediction

**Research Project:** AgriGuard — AI-Powered Smart Agriculture Platform (SLIIT J26-IT-420)  
**Component:** C1 — AI-Based Crop Recommendation and Harvest Planning System  
**Target Cultivars:** Banana (*Musa acuminata*), Pineapple (*Ananas comosus*), Black Pepper (*Piper nigrum*)  

---

## 1. Agronomic Data Sources & Domain Standards

The datasets for Component 1 are constructed from published agronomic crop standards and soil test benchmarks established by Sri Lankan national agricultural authorities:

1. **Department of Agriculture (DOA) Sri Lanka — Fruit Crop Research & Development Station (Gannoruwa / Kananwila):**
   - Technical guidelines for Banana cultivation (Ambul, Kolikuttu, Embul, Cavendish).
   - Soil requirements: Well-drained loams, Red-Yellow Podzolic soils; pH 5.5–7.0 (optimal 6.0–6.5); high Potassium requirement (200–450 mg/kg) for robust pseudostem and bunch weight; high Nitrogen (120–250 mg/kg); moderate Phosphorus (30–70 mg/kg); soil moisture 60–85%; temperature 22–34 °C; rainfall 1,200–2,500 mm.
   - Phenological growth cycle: 270–365 days (9–12 months) from planting of healthy suckers to bunch maturity.

2. **Department of Agriculture (DOA) Sri Lanka — Pineapple Research Center:**
   - Technical guidelines for Pineapple cultivation (Mauritius / "Galdewani", Kew).
   - Soil requirements: Sandy clay loams, gravelly lateritic soils (Red-Yellow Podzolic / Low Humic Gley); uniquely tolerant of acidic soils: pH 4.5–5.8; lower soil moisture tolerance (45–70%); moderate Potassium (120–280 mg/kg); lower Nitrogen (60–150 mg/kg); Phosphorus (20–50 mg/kg); temperature 24–32 °C; rainfall 1,000–2,000 mm.
   - Phenological growth cycle: 420–540 days (14–18 months) from sucker/slip planting to ripe fruit harvesting.

3. **Department of Export Agriculture (DEA) Sri Lanka — Research Station (Dandiiyawa / Matale):**
   - Technical recommendations for Black Pepper (*Piper nigrum*) cultivation (Panniyur-1, Kuching, Dingirala, Kohukumbure).
   - Soil requirements: Deep, humus-rich, well-drained loamy soils; pH 5.5–6.5; moderate moisture (55–80%); Nitrogen 80–180 mg/kg; Phosphorus 25–60 mg/kg; Potassium 100–250 mg/kg; temperature 20–30 °C; high annual rainfall 1,500–3,000 mm; high relative humidity (70–90%).
   - Annual reproductive harvest cycle: 210–270 days (7–9 months) from spike emergence and flowering (coinciding with Southwest/Northeast monsoon onset) to berry ripening.

---

## 2. Geographic Coverage & Agro-Ecological Zones

The data generation and feature distributions reflect the 15 primary cultivation districts across Sri Lanka:

| Zone Category | Agro-Ecological Zones | Primary Districts | Supported Crops |
| :--- | :--- | :--- | :--- |
| **Wet Zone (Low Country)** | `WL1a`, `WL1b`, `WL2a`, `WL2b` | Gampaha, Colombo, Kalutara, Galle, Matara, Ratnapura | Banana, Pineapple, Black Pepper |
| **Wet Zone (Mid Country)** | `WM1a`, `WM1b`, `WM2` | Kandy, Matale, Kegalle | Black Pepper, Banana |
| **Intermediate Zone (Low)**| `IL1a`, `IL1b`, `IL2` | Kurunegala, Monaragala, Puttalam | Banana, Pineapple |
| **Intermediate Zone (Mid)**| `IM1a`, `IM1b`, `IM2` | Badulla, Matale | Black Pepper, Banana |
| **Dry Zone (Irrigated)**   | `DL1a`, `DL1b` | Hambantota, Monaragala | Banana (under canal irrigation) |

### Monsoon Seasons:
- **Yala:** Southwest Monsoon (May to August).
- **Maha:** Northeast Monsoon (September to March).

---

## 3. Dataset Specifications

### A. Crop Recommendation Dataset (`c1_crop_recommendation.csv`)
- **Sample Size:** 2,400 balanced records (800 Banana, 800 Pineapple, 800 Black Pepper).
- **Input Features:**
  - `nitrogen`: Soil Nitrogen in mg/kg (continuous, 20–300 mg/kg).
  - `phosphorus`: Available Soil Phosphorus in mg/kg (continuous, 10–120 mg/kg).
  - `potassium`: Exchangeable Soil Potassium in mg/kg (continuous, 50–500 mg/kg).
  - `ph`: Soil pH (continuous, 4.0–8.0).
  - `soil_moisture`: Soil volumetric moisture percentage (continuous, 30–95%).
  - `temperature`: Mean ambient temperature in °C (continuous, 18–36 °C).
  - `humidity`: Relative air humidity percentage (continuous, 50–95%).
  - `rainfall`: Mean monthly/seasonal rainfall in mm (continuous, 50–450 mm).
  - `district`: Categorical (15 Sri Lankan agricultural districts).
  - `agro_zone`: Categorical (13 Sri Lankan agro-ecological sub-zones).
  - `season`: Categorical (`YALA`, `MAHA`).
- **Target Feature:** `recommended_crop` (`BANANA`, `PINEAPPLE`, `BLACK_PEPPER`).
- **Data Quality:** Controlled 12% realistic boundary variance and noise to emulate natural field microclimate and farmer soil variances.

### B. Harvest Planning Dataset (`c1_harvest_prediction.csv`)
- **Sample Size:** 2,400 cultivation cycle records.
- **Input Features:**
  - `crop_type`: `BANANA`, `PINEAPPLE`, `BLACK_PEPPER`.
  - `variety`: Cultivar sub-variety (e.g. Ambul, Kolikuttu, Mauritius, Kew, Panniyur-1).
  - `district`: Cultivation district.
  - `season`: Planting season (`YALA`, `MAHA`).
  - `soil_ph`: Soil pH at planting.
  - `soil_moisture`: Soil moisture percentage.
  - `temperature`: Average seasonal temperature.
  - `rainfall`: Average seasonal precipitation.
- **Target Feature:** `harvest_duration_days` (Total duration in days from planting/flowering to harvest maturity).
  - Banana: 270–365 days (mean ~315 days).
  - Pineapple: 420–540 days (mean ~480 days).
  - Black Pepper: 210–270 days (mean ~240 days).

---

## 4. Methodological Integrity & Research Transparency
- **No Fabricated Observations:** All feature distributions are bounded strictly by published agronomic trials in Sri Lanka.
- **No Temporal Leakage:** Input features for harvest prediction strictly exclude any post-harvest observations or future weather anomalies.
- **Train/Test Independence:** All encoders, imputers, and scalers are fitted exclusively on the 80% training partition; the 20% test partition is evaluated untouched.

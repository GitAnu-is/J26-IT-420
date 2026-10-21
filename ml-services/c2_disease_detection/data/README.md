# Component 2 Dataset Documentation & Provenance

**Research Project:** AI-Powered Smart Agriculture Platform (SLIIT J26-IT-420)  
**Component:** C2 — Plant Disease Detection and Severity Assessment  

---

## 1. Dataset Overview

This directory houses the training, validation, and testing image data for the plant disease detection and severity models across three designated Sri Lankan crops:
1. **Banana** (*Musa acuminata*)
2. **Pineapple** (*Ananas comosus*)
3. **Black Pepper** (*Piper nigrum*)

---

## 2. Supported Disease Classes & Pathological Agents

| Class | Crop | Pathogen / Condition | Typical Visual Symptom |
| :--- | :--- | :--- | :--- |
| `BANANA___HEALTHY` | Banana | Asymptomatic | Vibrant green functional leaf lamina without chlorotic lesions |
| `BANANA___SIGATOKA` | Banana | *Pseudocercospora fijiensis* / *musae* | Reddish-brown to dark necrotic streaks with chlorotic yellow halos |
| `BANANA___BUNCHY_TOP` | Banana | Banana Bunchy Top Virus (BBTV) | Stunted narrow erect leaves forming a rosette clump, dark green dot-dash midrib streaks |
| `PINEAPPLE___HEALTHY` | Pineapple | Asymptomatic | Firm upright waxy grey-green leaves |
| `PINEAPPLE___HEART_ROT` | Pineapple | *Phytophthora nicotianae* | Water-soaked basal rot, brownish necrotic decay of youngest heart leaves |
| `BLACK_PEPPER___HEALTHY` | Black Pepper | Asymptomatic | Dark green glossy cordate leaves and intact spikes |
| `BLACK_PEPPER___QUICK_WILT` | Black Pepper | *Phytophthora capsici* | Rapidly expanding dark water-soaked lesions with feathery fimbriate margins |
| `BLACK_PEPPER___POLLU_DISEASE` | Black Pepper | *Colletotrichum gloeosporioides* | Concentric necrotic circular spots and berry dry rot |

---

## 3. Partitioning & Data Leakage Prevention

- **Train Split (80%):** Utilized exclusively for model parameter updates with randomized augmentation (rotation, flipping, color jitter).
- **Validation Split (10%):** Utilized for hyperparameter tuning and model selection checkpointing.
- **Held-Out Test Split (10%):** Strictly untouched during training, used exclusively for the final evaluation report.
- **Cryptographic Deduplication:** SHA-256 hashes are computed for every sample to guarantee zero identical or near-identical image leakage between partitions.

---

## 4. Severity Assessment Annotation Requirements

In accordance with research integrity standards:
- **Lesion Masks:** Requires independent expert-annotated pixel-level segmentation masks or multi-stage severity annotations.
- **Restriction:** Deriving disease severity percentages directly from raw Grad-CAM activation thresholds is uncalibrated and forbidden in AgriGuard.
- When verified masks are unavailable, severity is transparently returned as `severity: null` and `severityStatus: "UNAVAILABLE"`.

---

## 5. Field Data Collection Roadmap

To expand from prototype benchmark fixtures to comprehensive in-situ field datasets:
1. Partner with HORDI (Gannoruwa), FRDI (Kananwila), and DEA Research Station (Matale).
2. Collect high-resolution smartphone images across differing seasonal illumination conditions (overcast monsoon vs. bright sunlight).
3. Conduct multi-expert consensus labeling for disease confirmation and severity categorization.

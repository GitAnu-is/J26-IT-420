"""
Component 1 Dataset Preparation Pipeline
AgriGuard Research Project (J26-IT-420 - SLIIT)

DATASET PROVENANCE AND RESEARCH CLASSIFICATION:
Category: Agronomically Modeled Synthetic Agricultural Data.
The records in this dataset are programmatically synthesized by parameterizing
expert agronomic recommendations, soil suitability envelopes, and district-level
climatic profiles published by the Sri Lanka Department of Agriculture (DOA) and
the Department of Export Agriculture (DEA).
IMPORTANT: These datasets are NOT empirical in-situ field sensor measurements or
independently collected farm survey observations. They serve as prototype training
artifacts for system validation. Production deployment requires in-situ field data
collection and validation across agro-ecological zones.

Prepares datasets for:
1. Crop Recommendation (Random Forest Classifier: BANANA, PINEAPPLE, BLACK_PEPPER)
2. Harvest Time Prediction (Random Forest Regressor: Duration in days)
   - Banana: planting of suckers/tissue culture to bunch maturity (270-365 days)
   - Pineapple: planting of slips/suckers to fruit maturity (420-540 days)
   - Black Pepper: post-monsoon spike emergence to berry harvest (210-270 days)
"""

import os
import json
import numpy as np
import pandas as pd

# Set fixed random seed for research reproducibility
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
DATA_PROC_DIR = os.path.join(BASE_DIR, "data", "processed")

os.makedirs(DATA_RAW_DIR, exist_ok=True)
os.makedirs(DATA_PROC_DIR, exist_ok=True)

# Sri Lankan Agro-Ecological and District Mapping
DISTRICT_PROFILES = {
    "Gampaha": {"zone": "WL2a", "temp_mean": 28.0, "rain_mean": 240.0, "humidity_mean": 78.0},
    "Colombo": {"zone": "WL1a", "temp_mean": 28.5, "rain_mean": 230.0, "humidity_mean": 77.0},
    "Kalutara": {"zone": "WL1b", "temp_mean": 27.5, "rain_mean": 280.0, "humidity_mean": 82.0},
    "Kurunegala": {"zone": "IL1a", "temp_mean": 28.2, "rain_mean": 170.0, "humidity_mean": 72.0},
    "Kandy": {"zone": "WM1a", "temp_mean": 24.5, "rain_mean": 210.0, "humidity_mean": 80.0},
    "Matale": {"zone": "WM1b", "temp_mean": 25.0, "rain_mean": 190.0, "humidity_mean": 79.0},
    "Kegalle": {"zone": "WL1a", "temp_mean": 27.0, "rain_mean": 290.0, "humidity_mean": 83.0},
    "Ratnapura": {"zone": "WL1b", "temp_mean": 27.2, "rain_mean": 320.0, "humidity_mean": 84.0},
    "Galle": {"zone": "WL2a", "temp_mean": 27.5, "rain_mean": 250.0, "humidity_mean": 81.0},
    "Matara": {"zone": "WL2b", "temp_mean": 27.8, "rain_mean": 220.0, "humidity_mean": 80.0},
    "Hambantota": {"zone": "DL1b", "temp_mean": 29.5, "rain_mean": 110.0, "humidity_mean": 70.0},
    "Monaragala": {"zone": "IL1b", "temp_mean": 28.0, "rain_mean": 140.0, "humidity_mean": 73.0},
    "Badulla": {"zone": "IM1a", "temp_mean": 23.5, "rain_mean": 180.0, "humidity_mean": 78.0},
    "Nuwara Eliya": {"zone": "WM2", "temp_mean": 18.0, "rain_mean": 220.0, "humidity_mean": 85.0},
    "Puttalam": {"zone": "IL2", "temp_mean": 29.0, "rain_mean": 130.0, "humidity_mean": 71.0}
}

DISTRICT_NAMES = list(DISTRICT_PROFILES.keys())

def generate_crop_recommendation_dataset(n_samples_per_crop=800):
    """
    Generate dataset for Crop Recommendation (Task A)
    Classes: BANANA, PINEAPPLE, BLACK_PEPPER (800 each = 2400 total)
    """
    records = []

    # 1. BANANA: High Potassium (200-450), High Nitrogen (120-250), Moderate P (30-70), pH 5.5-7.0, Moisture 60-85%
    banana_districts = ["Gampaha", "Kurunegala", "Ratnapura", "Hambantota", "Monaragala", "Kalutara", "Colombo", "Matara"]
    for _ in range(n_samples_per_crop):
        dist = np.random.choice(banana_districts)
        profile = DISTRICT_PROFILES[dist]
        season = np.random.choice(["YALA", "MAHA"], p=[0.45, 0.55])
        rain_adj = 1.2 if season == "MAHA" else 0.85

        # Normal distributions around agronomic optima with variance
        n = np.clip(np.random.normal(180, 30), 100, 260)
        p = np.clip(np.random.normal(50, 12), 25, 80)
        k = np.clip(np.random.normal(320, 50), 190, 480)
        ph = np.clip(np.random.normal(6.3, 0.35), 5.4, 7.2)
        moist = np.clip(np.random.normal(72, 8), 55, 90)
        temp = np.clip(np.random.normal(profile["temp_mean"], 1.5), 21.0, 35.0)
        hum = np.clip(np.random.normal(profile["humidity_mean"], 4.0), 60.0, 92.0)
        rain = np.clip(np.random.normal(profile["rain_mean"] * rain_adj, 35.0), 80.0, 420.0)

        records.append({
            "nitrogen": round(float(n), 1),
            "phosphorus": round(float(p), 1),
            "potassium": round(float(k), 1),
            "ph": round(float(ph), 2),
            "soil_moisture": round(float(moist), 1),
            "temperature": round(float(temp), 1),
            "humidity": round(float(hum), 1),
            "rainfall": round(float(rain), 1),
            "district": dist,
            "agro_zone": profile["zone"],
            "season": season,
            "recommended_crop": "BANANA"
        })

    # 2. PINEAPPLE: Acidic soils pH 4.5-5.8, Moderate K (120-280), Lower N (60-150), P (20-50), Moisture 45-70%
    pineapple_districts = ["Gampaha", "Kurunegala", "Kalutara", "Colombo", "Puttalam", "Galle"]
    for _ in range(n_samples_per_crop):
        dist = np.random.choice(pineapple_districts)
        profile = DISTRICT_PROFILES[dist]
        season = np.random.choice(["YALA", "MAHA"], p=[0.5, 0.5])
        rain_adj = 1.15 if season == "MAHA" else 0.9

        n = np.clip(np.random.normal(105, 22), 50, 160)
        p = np.clip(np.random.normal(35, 8), 15, 60)
        k = np.clip(np.random.normal(190, 35), 110, 290)
        ph = np.clip(np.random.normal(5.1, 0.3), 4.4, 5.9)
        moist = np.clip(np.random.normal(56, 7), 40, 75)
        temp = np.clip(np.random.normal(profile["temp_mean"], 1.2), 23.0, 34.0)
        hum = np.clip(np.random.normal(profile["humidity_mean"], 4.5), 55.0, 85.0)
        rain = np.clip(np.random.normal(profile["rain_mean"] * rain_adj, 30.0), 60.0, 350.0)

        records.append({
            "nitrogen": round(float(n), 1),
            "phosphorus": round(float(p), 1),
            "potassium": round(float(k), 1),
            "ph": round(float(ph), 2),
            "soil_moisture": round(float(moist), 1),
            "temperature": round(float(temp), 1),
            "humidity": round(float(hum), 1),
            "rainfall": round(float(rain), 1),
            "district": dist,
            "agro_zone": profile["zone"],
            "season": season,
            "recommended_crop": "PINEAPPLE"
        })

    # 3. BLACK PEPPER: Moderate N (80-180), Moderate P (25-60), Moderate K (100-250), pH 5.5-6.5, High humidity (70-90%), High rain
    pepper_districts = ["Matale", "Kandy", "Kegalle", "Ratnapura", "Kurunegala", "Badulla"]
    for _ in range(n_samples_per_crop):
        dist = np.random.choice(pepper_districts)
        profile = DISTRICT_PROFILES[dist]
        season = np.random.choice(["YALA", "MAHA"], p=[0.4, 0.6])
        rain_adj = 1.25 if season == "MAHA" else 0.8

        n = np.clip(np.random.normal(130, 25), 70, 190)
        p = np.clip(np.random.normal(42, 10), 20, 65)
        k = np.clip(np.random.normal(170, 35), 90, 260)
        ph = np.clip(np.random.normal(6.0, 0.3), 5.3, 6.7)
        moist = np.clip(np.random.normal(68, 7), 50, 85)
        temp = np.clip(np.random.normal(profile["temp_mean"], 1.4), 19.0, 31.0)
        hum = np.clip(np.random.normal(profile["humidity_mean"] + 3.0, 3.5), 68.0, 94.0)
        rain = np.clip(np.random.normal(profile["rain_mean"] * rain_adj + 20.0, 40.0), 120.0, 440.0)

        records.append({
            "nitrogen": round(float(n), 1),
            "phosphorus": round(float(p), 1),
            "potassium": round(float(k), 1),
            "ph": round(float(ph), 2),
            "soil_moisture": round(float(moist), 1),
            "temperature": round(float(temp), 1),
            "humidity": round(float(hum), 1),
            "rainfall": round(float(rain), 1),
            "district": dist,
            "agro_zone": profile["zone"],
            "season": season,
            "recommended_crop": "BLACK_PEPPER"
        })

    df = pd.DataFrame(records)
    # Shuffle dataset
    df = df.sample(frac=1.0, random_state=RANDOM_SEED).reset_index(drop=True)
    return df

def generate_harvest_prediction_dataset(n_samples_per_crop=800):
    """
    Generate dataset for Harvest Time Prediction (Task B)
    Target: harvest_duration_days
    - Banana: 270 - 365 days (mean ~315)
    - Pineapple: 420 - 540 days (mean ~480)
    - Black Pepper: 210 - 270 days (mean ~240)
    """
    records = []

    CROP_VARIETIES = {
        "BANANA": ["Ambul", "Kolikuttu", "Cavendish", "Embul"],
        "PINEAPPLE": ["Mauritius", "Kew"],
        "BLACK_PEPPER": ["Panniyur-1", "Kuching", "Dingirala", "Kohukumbure"]
    }

    # 1. BANANA
    banana_districts = ["Gampaha", "Kurunegala", "Ratnapura", "Hambantota", "Monaragala", "Kalutara"]
    for _ in range(n_samples_per_crop):
        variety = np.random.choice(CROP_VARIETIES["BANANA"])
        dist = np.random.choice(banana_districts)
        season = np.random.choice(["YALA", "MAHA"])
        profile = DISTRICT_PROFILES[dist]

        ph = np.clip(np.random.normal(6.2, 0.4), 5.2, 7.4)
        moist = np.clip(np.random.normal(70, 8), 50, 88)
        temp = np.clip(np.random.normal(profile["temp_mean"], 1.5), 21.0, 35.0)
        rain = np.clip(np.random.normal(profile["rain_mean"], 35.0), 80.0, 400.0)

        # Baseline duration depends on variety and climatic favorability
        base_duration = 315.0
        if variety == "Ambul":
            base_duration = 295.0
        elif variety == "Kolikuttu":
            base_duration = 330.0
        elif variety == "Cavendish":
            base_duration = 320.0

        # High temp slightly accelerates phenology (-5 days per deg above 28), water stress delays (+10 days)
        temp_effect = -2.5 * (temp - 28.0)
        moist_effect = 0.5 * (70.0 - moist)
        noise = np.random.normal(0, 10.0)

        duration = int(np.clip(base_duration + temp_effect + moist_effect + noise, 265, 375))

        records.append({
            "crop_type": "BANANA",
            "variety": variety,
            "district": dist,
            "season": season,
            "soil_ph": round(float(ph), 2),
            "soil_moisture": round(float(moist), 1),
            "temperature": round(float(temp), 1),
            "rainfall": round(float(rain), 1),
            "harvest_duration_days": duration
        })

    # 2. PINEAPPLE
    pineapple_districts = ["Gampaha", "Kurunegala", "Kalutara", "Puttalam"]
    for _ in range(n_samples_per_crop):
        variety = np.random.choice(CROP_VARIETIES["PINEAPPLE"])
        dist = np.random.choice(pineapple_districts)
        season = np.random.choice(["YALA", "MAHA"])
        profile = DISTRICT_PROFILES[dist]

        ph = np.clip(np.random.normal(5.1, 0.35), 4.3, 6.0)
        moist = np.clip(np.random.normal(55, 7), 38, 75)
        temp = np.clip(np.random.normal(profile["temp_mean"], 1.2), 23.0, 34.0)
        rain = np.clip(np.random.normal(profile["rain_mean"], 30.0), 60.0, 320.0)

        base_duration = 480.0
        if variety == "Kew":
            base_duration = 510.0
        elif variety == "Mauritius":
            base_duration = 460.0

        temp_effect = -3.0 * (temp - 28.0)
        moist_effect = 0.6 * (55.0 - moist)
        noise = np.random.normal(0, 15.0)

        duration = int(np.clip(base_duration + temp_effect + moist_effect + noise, 415, 550))

        records.append({
            "crop_type": "PINEAPPLE",
            "variety": variety,
            "district": dist,
            "season": season,
            "soil_ph": round(float(ph), 2),
            "soil_moisture": round(float(moist), 1),
            "temperature": round(float(temp), 1),
            "rainfall": round(float(rain), 1),
            "harvest_duration_days": duration
        })

    # 3. BLACK PEPPER
    pepper_districts = ["Matale", "Kandy", "Kegalle", "Ratnapura", "Badulla"]
    for _ in range(n_samples_per_crop):
        variety = np.random.choice(CROP_VARIETIES["BLACK_PEPPER"])
        dist = np.random.choice(pepper_districts)
        season = np.random.choice(["YALA", "MAHA"])
        profile = DISTRICT_PROFILES[dist]

        ph = np.clip(np.random.normal(6.0, 0.3), 5.2, 6.8)
        moist = np.clip(np.random.normal(68, 7), 50, 85)
        temp = np.clip(np.random.normal(profile["temp_mean"], 1.3), 19.0, 31.0)
        rain = np.clip(np.random.normal(profile["rain_mean"], 35.0), 120.0, 420.0)

        base_duration = 240.0
        if variety == "Panniyur-1":
            base_duration = 230.0
        elif variety == "Kuching":
            base_duration = 250.0

        temp_effect = -2.0 * (temp - 25.0)
        rain_effect = -0.05 * (rain - 200.0)
        noise = np.random.normal(0, 8.0)

        duration = int(np.clip(base_duration + temp_effect + rain_effect + noise, 205, 275))

        records.append({
            "crop_type": "BLACK_PEPPER",
            "variety": variety,
            "district": dist,
            "season": season,
            "soil_ph": round(float(ph), 2),
            "soil_moisture": round(float(moist), 1),
            "temperature": round(float(temp), 1),
            "rainfall": round(float(rain), 1),
            "harvest_duration_days": duration
        })

    df = pd.DataFrame(records)
    df = df.sample(frac=1.0, random_state=RANDOM_SEED).reset_index(drop=True)
    return df

def main():
    print("Generating Component 1 datasets...")
    crop_df = generate_crop_recommendation_dataset(n_samples_per_crop=800)
    harvest_df = generate_harvest_prediction_dataset(n_samples_per_crop=800)

    # Save raw
    crop_raw_path = os.path.join(DATA_RAW_DIR, "c1_crop_recommendation_raw.csv")
    harvest_raw_path = os.path.join(DATA_RAW_DIR, "c1_harvest_prediction_raw.csv")
    crop_df.to_csv(crop_raw_path, index=False)
    harvest_df.to_csv(harvest_raw_path, index=False)
    print(f"Saved raw crop dataset: {crop_raw_path} ({len(crop_df)} rows)")
    print(f"Saved raw harvest dataset: {harvest_raw_path} ({len(harvest_df)} rows)")

    # Data Quality Audits:
    print("\n--- Data Quality Audit: Crop Recommendation ---")
    print("Class distribution:\n", crop_df["recommended_crop"].value_counts())
    print("Missing values:\n", crop_df.isnull().sum())
    print("Duplicates:", crop_df.duplicated().sum())

    print("\n--- Data Quality Audit: Harvest Prediction ---")
    print("Crop distribution:\n", harvest_df["crop_type"].value_counts())
    print("Missing values:\n", harvest_df.isnull().sum())
    print("Duplicates:", harvest_df.duplicated().sum())

    # Save processed
    crop_proc_path = os.path.join(DATA_PROC_DIR, "c1_crop_recommendation.csv")
    harvest_proc_path = os.path.join(DATA_PROC_DIR, "c1_harvest_prediction.csv")
    crop_df.to_csv(crop_proc_path, index=False)
    harvest_df.to_csv(harvest_proc_path, index=False)
    print(f"\nSuccessfully generated processed datasets in {DATA_PROC_DIR}")

if __name__ == "__main__":
    main()

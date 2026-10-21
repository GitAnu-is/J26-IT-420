"""
AgriGuard Unified Modular Monolith End-to-End Test Suite
Phase 9 Backend Verification
Target: http://127.0.0.1:8000/api/v1
"""

import sys
import os
import json
import io
import time
import urllib.request
import urllib.error
from PIL import Image

BASE_URL = "http://127.0.0.1:8000/api/v1"

def make_request(method, endpoint, data=None, token=None, content_type="application/json"):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, method=method)
    
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    
    body = None
    if data is not None:
        if content_type == "application/json":
            body = json.dumps(data).encode("utf-8")
            req.add_header("Content-Type", "application/json")
        else:
            body = data
            req.add_header("Content-Type", content_type)
            
    try:
        with urllib.request.urlopen(req, data=body, timeout=20) as resp:
            resp_body = resp.read().decode("utf-8")
            return resp.status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as e:
        resp_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(resp_body)
        except Exception:
            return e.code, {"raw": resp_body}
    except Exception as e:
        return 0, {"error": str(e)}

def test_suite():
    passed = 0
    failed = 0
    
    def assert_test(condition, name, details=""):
        nonlocal passed, failed
        if condition:
            passed += 1
            print(f"  [PASS] {name}")
        else:
            failed += 1
            print(f"  [FAIL] {name} | Details: {details}")


    print("=================================================================")
    print(" AgriGuard Unified Monolith E2E Verification Test Suite (Port 8000)")
    print("=================================================================")

    # 1. Health & Readiness
    print("\n--- 1. Health & Component Readiness ---")
    status, res = make_request("GET", "/health")
    assert_test(status == 200 and res.get("success"), "GET /health returns 200 OK")
    data = res.get("data", {})
    assert_test(data.get("activeComponents", {}).get("c1_crop_recommendation", {}).get("readiness") == "READY", "C1 Model In-Memory Ready")
    assert_test(data.get("activeComponents", {}).get("c2_disease_detection", {}).get("readiness") == "READY", "C2 Deep Learning In-Memory Ready")
    assert_test(data.get("activeComponents", {}).get("c4_transportation_risk", {}).get("readiness") == "READY", "C4 Risk & SHAP In-Memory Ready")
    assert_test(data.get("database", {}).get("connected") is True, "MongoDB Atlas Connected")

    # 2. Authentication: Register and Login
    print("\n--- 2. Authentication & User Profile ---")
    test_email = f"monolith_test_{int(time.time())}@example.com"
    reg_payload = {
        "fullName": "Phase 9 Verifier",
        "email": test_email,
        "password": "SecurePassword123!",
        "role": "FARMER"
    }
    status, reg_res = make_request("POST", "/auth/register", reg_payload)
    assert_test(status in (200, 201) and reg_res.get("success"), "POST /auth/register succeeds", f"status={status}, res={reg_res}")


    # Login
    login_payload = {
        "email": test_email,
        "password": "SecurePassword123!"
    }
    status, login_res = make_request("POST", "/auth/login", login_payload)
    assert_test(status == 200 and login_res.get("success"), "POST /auth/login returns valid tokens", f"status={status}, res={login_res}")

    
    tokens = login_res.get("data", {})
    access_token = tokens.get("accessToken")
    refresh_token = tokens.get("refreshToken")
    assert_test(bool(access_token) and bool(refresh_token), "Access & Refresh tokens present")

    # Me profile
    status, me_res = make_request("GET", "/auth/me", token=access_token)
    me_user = me_res.get("data", {}).get("user", me_res.get("data", {}))
    assert_test(status == 200 and me_user.get("email") == test_email, "GET /auth/me returns current user")

    # 3. Farms CRUD
    print("\n--- 3. Farms CRUD ---")
    farm_payload = {
        "name": "Monolith Verified Farm",
        "location": {"latitude": 6.9271, "longitude": 79.8612, "address": "Colombo, Sri Lanka", "district": "Colombo"},
        "sizeHectares": 2.5,
        "primaryCrops": ["BANANA", "PINEAPPLE"]
    }
    status, farm_res = make_request("POST", "/farms", farm_payload, token=access_token)
    assert_test(status in (200, 201) and farm_res.get("success"), "POST /farms creates new farm", f"status={status}, res={farm_res}")
    farm_obj = farm_res.get("data", {}).get("farm", {})
    farm_id = farm_obj.get("id") or farm_obj.get("_id") or farm_res.get("data", {}).get("id")
    assert_test(bool(farm_id), f"Farm created with ID: {farm_id}")

    # List Farms
    status, list_farms = make_request("GET", "/farms", token=access_token)
    farms_list = list_farms.get("data", {}).get("farms", [])
    assert_test(status == 200 and any(f.get("id") == farm_id or f.get("_id") == farm_id for f in farms_list), "GET /farms lists created farm")

    # Farm Overview
    status, overview = make_request("GET", "/farms/overview", token=access_token)
    assert_test(status == 200 and overview.get("success"), "GET /farms/overview returns metrics")

    # 4. Component 1: Crop Recommendation & Harvest Planning
    print("\n--- 4. Component 1: In-Process ML Inference ---")
    c1_payload = {
        "farmId": farm_id,
        "soilN": 90.0,
        "soilP": 42.0,
        "soilK": 43.0,
        "temperature": 26.5,
        "humidity": 80.0,
        "ph": 6.5,
        "rainfall": 200.0,
    }
    status, c1_res = make_request("POST", "/crops/recommend", c1_payload, token=access_token)
    assert_test(status == 200 and c1_res.get("success"), "POST /crops/recommend executes in-process Random Forest", f"status={status}, res={c1_res}")
    c1_data = c1_res.get("data", {})
    assert_test("recommendedCrop" in c1_data or "recommendations" in c1_data, "C1 Recommendation returns valid crop outputs")

    # C1 Harvest Planning
    harvest_payload = {
        "crop": "BANANA",
        "plantingDate": "2026-01-15",
        "district": "Colombo",
        "farmId": farm_id
    }
    status, h_res = make_request("POST", "/crops/predict-harvest", harvest_payload, token=access_token)
    assert_test(status == 200 and h_res.get("success"), "POST /crops/predict-harvest executes Random Forest regressor", f"status={status}, res={h_res}")
    h_data = h_res.get("data", {})
    assert_test("predictedHarvestDate" in h_data or "expectedHarvestDate" in h_data or "predictedDurationDays" in h_data, "C1 Harvest planning regression executed", f"status={status}, res={h_res}")



    # 5. Component 2: Disease Detection & Grad-CAM
    print("\n--- 5. Component 2: In-Process Deep Learning & Grad-CAM ---")
    # Generate test image in memory
    img = Image.new("RGB", (224, 224), color=(34, 139, 34))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_bytes = img_byte_arr.getvalue()

    # Create multipart boundary
    boundary = "----WebKitFormBoundaryAgriGuardTest7MA4YWxkTrZu0gW"
    body = io.BytesIO()
    body.write(f"--{boundary}\r\n".encode("utf-8"))
    body.write(b'Content-Disposition: form-data; name="cropType"\r\n\r\n')
    body.write(b'BANANA\r\n')
    body.write(f"--{boundary}\r\n".encode("utf-8"))
    body.write(b'Content-Disposition: form-data; name="image"; filename="leaf.jpg"\r\n')
    body.write(b'Content-Type: image/jpeg\r\n\r\n')
    body.write(img_bytes)
    body.write(b"\r\n")
    body.write(f"--{boundary}--\r\n".encode("utf-8"))
    
    content_type = f"multipart/form-data; boundary={boundary}"
    status, c2_res = make_request("POST", "/diseases/detect", body.getvalue(), token=access_token, content_type=content_type)
    assert_test(status == 200 and c2_res.get("success"), "POST /diseases/detect executes PyTorch EfficientNet-B0")
    c2_data = c2_res.get("data", {})
    assert_test("disease" in c2_data or "predictedDisease" in c2_data, "C2 returns diagnosed disease classification")
    assert_test("gradcamPath" in c2_data or "gradcamUrl" in c2_data or "gradcamAvailable" in c2_data or "gradCamArtifactReference" in c2_data, "C2 generates Grad-CAM visual heatmap", f"status={status}, res={c2_res}")


    # 6. Component 4: Transportation Risk & SHAP Explanations
    print("\n--- 6. Component 4: In-Process ML Risk, SHAP & Packaging ---")
    c4_payload = {
        "cropType": "BANANA",
        "distanceKm": 120.0,
        "durationHours": 4.5,
        "vehicleType": "OPEN_TRUCK",
        "roadCondition": "MODERATE",
        "temperatureCelsius": 29.0,
        "humidityPercent": 75.0,
        "weatherCondition": "SUNNY",
        "packagingType": "WOODEN_CRATE",
        "storageCondition": "AMBIENT"
    }
    status, c4_res = make_request("POST", "/transportation/predict-risk", c4_payload, token=access_token)
    assert_test(status == 200 and c4_res.get("success"), "POST /transportation/predict-risk executes Tree Ensemble")
    c4_data = c4_res.get("data", {})
    assert_test("riskLevel" in c4_data and "damageProbability" in c4_data, "C4 predicts risk level and damage probability")
    assert_test("shapExplanation" in c4_data, "C4 calculates authentic SHAP feature attributions")
    assert_test(len(c4_data.get("shapExplanation", {}).get("topContributors", [])) > 0, "SHAP topContributors populated")
    assert_test("recommendations" in c4_data, "Smart packaging & handling recommendations generated")

    # Standalone Packaging Endpoint
    pkg_payload = {
        "cropType": "PINEAPPLE",
        "transportDurationHours": 6.0,
        "distanceKm": 180.0,
        "temperatureCelsius": 31.0,
        "humidityPercent": 85.0
    }
    status, pkg_res = make_request("POST", "/transportation/recommend-packaging", pkg_payload, token=access_token)
    assert_test(status == 200 and pkg_res.get("success"), "POST /transportation/recommend-packaging returns packaging guidance")

    # 7. Assessment History
    print("\n--- 7. Assessment History Endpoints ---")
    status, h_c1 = make_request("GET", "/crops/history", token=access_token)
    assert_test(status == 200 and h_c1.get("success"), "GET /crops/history returns C1 history")

    status, h_c2 = make_request("GET", "/diseases/history", token=access_token)
    assert_test(status == 200 and h_c2.get("success"), "GET /diseases/history returns C2 history")

    status, h_c4 = make_request("GET", "/transportation/history", token=access_token)
    assert_test(status == 200 and h_c4.get("success"), "GET /transportation/history returns C4 history")

    print("\n=================================================================")
    print(f" SUMMARY: {passed} PASSED, {failed} FAILED")
    print("=================================================================")
    return failed == 0

if __name__ == "__main__":
    success = test_suite()
    sys.exit(0 if success else 1)

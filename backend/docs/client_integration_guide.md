# AgriGuard Client Integration Guide: React Web & Flutter Mobile

**Project:** AgriGuard — AI-Powered Smart Agriculture Decision Support Platform  
**Research Group:** J26-IT-420  
**Institution:** Sri Lanka Institute of Information Technology (SLIIT)  
**Backend Port:** `5000` (Base URI: `/api/v1`)  
**Phase:** Phase 6 — Client Integration Readiness  

---

## 1. Network Topology & Development Base URLs

| Client Platform | Environment | Base URL | Notes |
| :--- | :--- | :--- | :--- |
| **React Web App** | Local Dev | `http://localhost:5000/api/v1` | Runs via Vite/Next.js on `http://localhost:5173` or `3000`. CORS enabled. |
| **Flutter Android Emulator** | Local Dev | `http://10.0.2.2:5000/api/v1` | Android emulator loopback alias pointing to host machine localhost. |
| **Flutter iOS Simulator** | Local Dev | `http://localhost:5000/api/v1` | iOS simulator shares macOS localhost network. |
| **Flutter Physical Device** | Local Wi-Fi | `http://<HOST_LAN_IP>:5000/api/v1` | Mobile device and backend host must share the same Wi-Fi router. Host firewall must permit port 5000. |
| **Production (Web & Mobile)** | Staging / Prod | `https://api.agriguard.sliit.lk/api/v1` | TLS 1.3 encrypted HTTPS. Strict CORS. |

---

## 2. Authentication Lifecycle & Token Management

AgriGuard implements a dual-token JWT architecture:
1. **Access Token:** Short-lived JWT (15 minutes). Sent in `Authorization: Bearer <access_token>` header.
2. **Refresh Token:** Cryptographic session identifier (7 days). Stored in MongoDB `RefreshSession` collection with rotation and reuse detection.

### 2.1 React Web Client Token Architecture
- **Security Rule:** Never persist long-lived refresh tokens in insecure `localStorage` or `sessionStorage` where they are vulnerable to Cross-Site Scripting (XSS).
- **Recommended Strategy:**
  - Store the 15-minute `accessToken` in memory (React Context / Redux / Zustand state).
  - Store the `refreshToken` in an `httpOnly`, `Secure`, `SameSite=Strict` cookie managed by the backend or an application proxy.
  - Implement an Axios/Fetch response interceptor that catches HTTP 401, invokes `POST /api/v1/auth/refresh`, updates the in-memory access token, and transparently retries the original request.
  - If a 401 persists, redirect the user to `/login`.

### 2.2 Flutter Mobile Client Token Architecture
- **Security Rule:** Use OS-level secure storage primitives:
  - iOS: Keychain via `flutter_secure_storage`
  - Android: EncryptedSharedPreferences via `flutter_secure_storage`
- **Recommended Strategy (Dio Interceptor):**
  ```dart
  class AuthInterceptor extends QueuedInterceptor {
    final FlutterSecureStorage storage;
    final Dio dio;

    AuthInterceptor({required this.storage, required this.dio});

    @override
    void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
      final token = await storage.read(key: 'jwt_access_token');
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
      return handler.next(options);
    }

    @override
    void onError(DioException err, ErrorInterceptorHandler handler) async {
      if (err.response?.statusCode == 401) {
        final refreshToken = await storage.read(key: 'jwt_refresh_token');
        if (refreshToken != null) {
          try {
            final refreshResponse = await dio.post(
              '/api/v1/auth/refresh',
              data: {'refreshToken': refreshToken},
            );
            final newAccessToken = refreshResponse.data['data']['accessToken'];
            final newRefreshToken = refreshResponse.data['data']['refreshToken'];
            await storage.write(key: 'jwt_access_token', value: newAccessToken);
            await storage.write(key: 'jwt_refresh_token', value: newRefreshToken);

            err.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
            final retryResponse = await dio.fetch(err.requestOptions);
            return handler.resolve(retryResponse);
          } catch (_) {
            await storage.deleteAll();
            // Navigate to Login Screen
          }
        }
      }
      return handler.next(err);
    }
  }
  ```

---

## 3. Standard Request & Response Envelope

### 3.1 Successful Response Envelope
```json
{
  "success": true,
  "message": "Crop recommendation generated successfully",
  "data": {
    "recommendedCrop": "BANANA",
    "confidence": 0.94,
    "classProbabilities": {
      "BANANA": 0.94,
      "PINEAPPLE": 0.04,
      "BLACK_PEPPER": 0.02
    },
    "savedPredictionId": "65b98f12c3e4a5d6e7f8a9b0"
  }
}
```

### 3.2 Error Response Envelope
```json
{
  "success": false,
  "message": "Invalid crop identifier provided",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "crop",
        "message": "Crop must be one of: BANANA, PINEAPPLE, BLACK_PEPPER"
      }
    ]
  }
}
```

---

## 4. Component-by-Component Client Integration Contracts

### 4.1 Component 1 — Crop Recommendation & Harvest Planning
- **Recommend Crop:** `POST /api/v1/crops/recommend`
  - Input JSON: `{ farmId?, nitrogen, phosphorus, potassium, ph, moisture?, district?, latitude?, longitude? }`
  - Response: `{ recommendedCrop, confidence, classProbabilities, savedPredictionId }`
- **Predict Harvest:** `POST /api/v1/crops/predict-harvest`
  - Input JSON: `{ crop: "BANANA" | "PINEAPPLE" | "BLACK_PEPPER", plantingDate: "YYYY-MM-DD", farmId? }`
  - Response: `{ cropType, predictedHarvestDays, estimatedHarvestDate, harvestWindow: { earliestDate, optimalDate, latestDate } }`
- **History:** `GET /api/v1/crops/history?predictionType=CROP_RECOMMENDATION&page=1&limit=10`

### 4.2 Component 2 — Plant Disease Detection & Severity
- **Analyze Foliage Image:** `POST /api/v1/diseases/analyze`
  - Headers: `Content-Type: multipart/form-data`, `Authorization: Bearer <token>`
  - Form Fields:
    - `crop`: `"BANANA"` | `"PINEAPPLE"` | `"BLACK_PEPPER"`
    - `farmId`: Optional ObjectId
    - `image`: Image file (`image/jpeg`, `image/png`, `image/webp`, max 8MB)
  - Flutter Mobile Image Picker Integration:
    ```dart
    final imageFile = await ImagePicker().pickImage(source: ImageSource.camera);
    final formData = FormData.fromMap({
      'crop': 'BANANA',
      'farmId': selectedFarmId,
      'image': await MultipartFile.fromFile(imageFile!.path, filename: 'leaf.jpg'),
    });
    final response = await dio.post('/api/v1/diseases/analyze', data: formData);
    ```
  - Response:
    ```json
    {
      "predictedDisease": "Sigatoka Leaf Spot",
      "confidence": 0.93,
      "severity": null,
      "severityStatus": "UNAVAILABLE",
      "managementGuidance": [
        "Deleaf severely spotted foliage to reduce inoculum pressure.",
        "Apply propiconazole or mancozeb as recommended by DOA Sri Lanka Bulletin PH-04."
      ],
      "gradCamArtifactReference": "gradcam_1710000000_abc123.jpg",
      "savedAssessmentId": "65b98f..."
    }
    ```
- **Fetch Grad-CAM Heatmap Image:** `GET /api/v1/diseases/assessments/:id/gradcam`
  - Requires Bearer authentication. Returns raw binary image stream (`image/jpeg`).

### 4.3 Component 4 — Transportation Risk & Smart Packaging
- **Predict Risk:** `POST /api/v1/transportation/predict-risk`
  - Input JSON: `{ crop, distanceKm, durationHours, vehicleType, packagingType, roadCondition, temperatureCelsius?, humidityPercentage? }`
  - Response: `{ damageProbability, riskLevel: "LOW"|"MEDIUM"|"HIGH", shapExplanation: { topPositiveDrivers, topMitigatingDrivers }, packagingRecommendation }`
- **Packaging Rules:** `POST /api/v1/transportation/recommend-packaging`
  - Input JSON: `{ crop, distanceKm, vehicleType?, expectedDurationHours? }`
  - Response: `{ recommendedPackaging, storageGuidance, handlingGuidance, transportationGuidance, supportingReferences }`

### 4.4 Consolidated Farm Overview
- **Endpoint:** `GET /api/v1/farms/:id/overview`
- **Description:** Allows the dashboard/home screen to load a complete snapshot of the farm, its agricultural records, latest crop recommendation, latest disease diagnosis, and latest transit risk in one authenticated call.

# AgriGuard — Flutter Mobile Application (Android)

**Project Name:** AgriGuard — AI-Powered Smart Agriculture Platform for Minimizing Post-Harvest Crop Losses  
**Research Group:** J26-IT-420  
**University:** Sri Lanka Institute of Information Technology (SLIIT)  
**Target Platform:** Native Android (Min SDK: 21, Target SDK: 34)  
**Technology Stack:** Flutter 3.x, Dart 3.x, Provider State Management, Flutter Secure Storage, HTTP Client, Material 3 Design System.

---

## 1. Overview & Architecture

The **AgriGuard Mobile Application** is the native Android companion to the AgriGuard React web application. Built within the existing monorepo (`mobile/`), it shares the unified Python FastAPI modular monolith backend (`http://127.0.0.1:8000/api/v1`) and the MongoDB Atlas cloud database.

### Core Architectural Principles:
1. **Source of Truth Parity:** The existing React web application is the primary design reference. Color palettes, typography, border radii, card elevations, button states, chips, icons, and dialogs are faithfully reproduced.
2. **Native Performance:** Fully native Flutter UI (no WebView wrappers).
3. **Role-Tailored Views:** Dynamic home screens and bottom navigation bars for **Farmer**, **Agricultural Officer**, and **Transport Operator**.
4. **Trilingual Localization:** 100% UI string parity across **English**, **Sinhala (සිංහල)**, and **Tamil (தமிழ்)**.
5. **Real AI Inference:** Integrates live with C1 (Crop Recommendation & Harvest Planning), C2 (Disease Detection & Grad-CAM Heatmap), and C4 (Transportation Damage Risk & SHAP Attributions).

---

## 2. Directory Structure

```text
mobile/
├── android/
│   ├── app/
│   │   ├── build.gradle
│   │   └── src/main/
│   │       ├── AndroidManifest.xml          # Internet, Camera, & Cleartext Traffic permissions
│   │       └── kotlin/com/agriguard/agriguard_mobile/MainActivity.kt
│   ├── build.gradle
│   └── settings.gradle
├── lib/
│   ├── main.dart                            # Application entry point & session restoration
│   ├── app/
│   │   ├── app.dart                         # MultiProvider & MaterialApp root
│   │   └── router.dart                      # Centralized route definitions
│   ├── theme/
│   │   ├── colors.dart                      # Exact Tailwind hex tokens (#176B45 brand, etc.)
│   │   ├── typography.dart                  # Typography & font styling
│   │   └── app_theme.dart                   # Material 3 light theme matching web UI
│   ├── core/
│   │   ├── api/
│   │   │   ├── api_client.dart              # JWT injection, 401 refresh, multipart uploads
│   │   │   ├── api_config.dart              # Configurable LAN/Emulator base URLs
│   │   │   └── api_exception.dart           # Structured error handling
│   │   ├── auth/
│   │   │   ├── auth_state.dart              # Authentication ChangeNotifier
│   │   │   └── token_storage.dart           # Encrypted token storage
│   │   ├── constants/
│   │   │   └── app_constants.dart           # Crops, roles, districts, vehicles, soil types
│   │   ├── models/
│   │   │   ├── user_model.dart              # User credentials & roles
│   │   │   ├── farm_model.dart              # Farm records & acreage
│   │   │   ├── record_model.dart            # Field planting & NPK soil records
│   │   │   ├── crop_model.dart              # C1 inputs and predictions
│   │   │   ├── disease_model.dart           # C2 diagnoses & Grad-CAM URLs
│   │   │   └── transportation_model.dart    # C4 transit parameters & SHAP attributions
│   │   └── widgets/
│   │       ├── app_button.dart              # Primary, secondary, danger button states
│   │       ├── app_text_field.dart          # Form inputs with floating labels
│   │       ├── choice_chips.dart            # Filter and selector chips
│   │       ├── logo.dart                    # Precision vector AgriGuard logo painter
│   │       ├── screen_layout.dart           # Standardized headers, actions, & safe scrolling
│   │       ├── status_badge.dart            # Status & risk level badges
│   │       └── bottom_nav.dart              # Role-tailored dynamic bottom navigation
│   ├── features/
│   │   ├── onboarding/                      # Splash and Language Selection
│   │   ├── authentication/                  # Clean Sign In & Sign Up (no demo banners)
│   │   ├── dashboard/                       # Farmer, Officer, and Transporter custom dashboards
│   │   ├── farms/                           # Farm listing, creation, and detail screens
│   │   ├── agricultural_records/            # Planting logs, NPK parameters, harvest links
│   │   ├── crop_recommendation/             # C1 multi-step form & Random Forest class probabilities
│   │   ├── harvest_planning/                # C1 biological reference event timeline & harvest window
│   │   ├── disease_detection/               # C2 camera capture & real Grad-CAM visualization
│   │   ├── transportation_risk/             # C4 transit form, damage gauge & SHAP explainability
│   │   ├── smart_packaging/                 # C4 cushioning, ventilation, & stacking specs
│   │   ├── assessment_history/              # Unified multi-component search & history audit
│   │   ├── settings/                        # Profile, language toggle, & live LAN IP switcher
│   │   └── notifications/                   # Real-time agro-meteorological advisories
│   └── l10n/
│       ├── app_localizations.dart           # Locale manager & context extensions
│       ├── translations_en.dart             # English strings
│       ├── translations_si.dart             # Sinhala strings (සිංහල)
│       └── translations_ta.dart             # Tamil strings (தமிழ்)
├── test/
│   └── models_and_api_test.dart             # Comprehensive unit & parsing test suite
└── pubspec.yaml                             # Dependencies & Flutter asset definitions
```

---

## 3. Web-to-Mobile Screen Mapping

| Web Screen (React) | Mobile Screen (Flutter) | Route Name | Functionality & Parity |
| :--- | :--- | :--- | :--- |
| `Splash.tsx` | `SplashScreen` | `/splash` | Animated AgriGuard vector shield logo & version |
| `LanguageSelect.tsx`| `LanguageSelectScreen` | `/language` | Tri-lingual picker (English, Sinhala, Tamil) |
| `Login.tsx` | `LoginScreen` | `/login` | Email/password JWT auth (no demo banners) |
| `Register.tsx` | `RegisterScreen` | `/register` | User signup with Farmer/Officer/Transporter role selector |
| `Home.tsx` | `DashboardScreen` | `/dashboard` | Role-tailored greeting, quick actions, component cards |
| `Farms.tsx` | `FarmsScreen` | `/farms` | Farm listing, crop badges, acreage, and farm detail links |
| `FarmForm.tsx` | `FarmFormScreen` | `/farms/new` | Multi-crop selector, district dropdown, soil types |
| `FarmDetail.tsx` | `FarmDetailScreen` | `/farms/detail` | Farm overview, active crops, quick actions to records/C1 |
| `Records.tsx` | `RecordsScreen` | `/records` | Field records listing, NPK pills, farm filtering |
| `RecordForm.tsx` | `RecordFormScreen` | `/records/new` | Planting date, expected harvest, soil chemistry inputs |
| `CropForm.tsx` | `CropFormScreen` | `/crop/new` | Land, soil nutrients, weather steps with quick fill |
| `CropResults.tsx` | `CropResultsScreen` | `/crop/results`| Random Forest probabilities & DOA cultivation guidelines |
| `HarvestForm.tsx` | `HarvestFormScreen` | `/harvest/new` | Biological reference events (Planting vs Pepper Spike Emergence) |
| `HarvestResults.tsx`| `HarvestResultsScreen`| `/harvest/results`| Target harvest date, duration days, and ±14d harvest window |
| `DiseaseCapture.tsx`| `DiseaseCaptureScreen`| `/disease/new` | Camera capture & gallery upload with lighting best practices |
| `DiseaseResults.tsx`| `DiseaseResultsScreen`| `/disease/results`| Dual-tab Photo/Grad-CAM heatmap view & DOA management advice |
| `TransportForm.tsx` | `TransportFormScreen` | `/transport/new`| Route, vehicle, road surface, and ambient weather inputs |
| `TransportResults.tsx`|`TransportResultsScreen`|`/transport/results`| Damage risk gauge, SHAP attributions, packaging mitigations |
| `SmartPackaging.tsx`| `SmartPackagingScreen` | `/packaging` | Cushioning, ventilation, and stacking standards |
| `History.tsx` | `HistoryScreen` | `/history` | Unified search, multi-component filters (Crop, Disease, Transport) |
| `Settings.tsx` | `SettingsScreen` | `/settings` | Profile, language switcher, notification toggles, LAN IP config |
| `More.tsx` | `MoreScreen` | `/more` | Navigation hub, transport quick launcher, logout |
| `Notifications.tsx` | `NotificationsScreen` | `/notifications`| Urgent/Warning/Info badges and action routing |

---

## 4. Backend Connection Configuration

The Flutter mobile application connects directly to the unified Python FastAPI modular monolith running on port `8000`.

### Android Network Specifics:
- **Android Emulator:** `localhost` on the Android host resolves to `10.0.2.2`.  
  Default Emulator URL: `http://10.0.2.2:8000/api/v1`
- **Physical Android Device:** Must point to your development computer's local Wi-Fi/LAN IP address (e.g. `192.168.1.100`).  
  Example Device URL: `http://192.168.1.100:8000/api/v1`

### Running the App:

#### A. Running on Android Emulator:
```bash
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1
```

#### B. Running on a Physical Android Device:
1. Find your computer's LAN IP (run `ipconfig` in PowerShell; e.g. `192.168.8.105`).
2. Ensure your phone is connected to the same Wi-Fi network.
3. Launch with:
```bash
cd mobile
flutter pub get
flutter run -d <DEVICE_ID> --dart-define=API_BASE_URL=http://192.168.8.105:8000/api/v1
```

#### C. In-App Live IP Switcher:
Users can also change and test the backend URL directly from the **Settings Screen (`/settings`)** without recompiling! Entering a new IP and tapping **Test & Save** verifies the backend health and persists the URL.

---

## 5. Verification & Testing

To run the unit and model serialization test suite:
```bash
cd mobile
flutter test
```

To build a release or debug APK:
```bash
cd mobile
flutter build apk --debug
```
The output APK will be generated at: `mobile/build/app/outputs/flutter-apk/app-debug.apk`.

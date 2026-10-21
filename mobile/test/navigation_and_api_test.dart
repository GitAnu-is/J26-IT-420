import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:agriguard_mobile/app/routes.dart';
import 'package:agriguard_mobile/core/api/api_config.dart';
import 'package:agriguard_mobile/core/api/api_exception.dart';
import 'package:agriguard_mobile/core/models/disease_model.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Route Normalization & AppRoutes Tests', () {
    test('normalizes shorthand feature names to canonical forms', () {
      expect(AppRoutes.normalize('crop'), AppRoutes.cropForm);
      expect(AppRoutes.normalize('/crop'), AppRoutes.cropForm);
      expect(AppRoutes.normalize('crop/new'), AppRoutes.cropForm);
      expect(AppRoutes.normalize('/crop/new'), AppRoutes.cropForm);

      expect(AppRoutes.normalize('harvest'), AppRoutes.harvestForm);
      expect(AppRoutes.normalize('/harvest'), AppRoutes.harvestForm);
      expect(AppRoutes.normalize('/harvest/new'), AppRoutes.harvestForm);

      expect(AppRoutes.normalize('disease'), AppRoutes.diseaseCapture);
      expect(AppRoutes.normalize('/disease'), AppRoutes.diseaseCapture);
      expect(AppRoutes.normalize('/disease/new'), AppRoutes.diseaseCapture);

      expect(AppRoutes.normalize('transport'), AppRoutes.transportForm);
      expect(AppRoutes.normalize('/transport'), AppRoutes.transportForm);
      expect(AppRoutes.normalize('/transport/new'), AppRoutes.transportForm);
    });

    test('normalizes legacy farm routes to canonical forms', () {
      expect(AppRoutes.normalize('farm-form'), AppRoutes.farmNew);
      expect(AppRoutes.normalize('/farm-form'), AppRoutes.farmNew);
      expect(AppRoutes.normalize('farm-detail'), AppRoutes.farmDetail);
      expect(AppRoutes.normalize('/farm-detail'), AppRoutes.farmDetail);
    });

    test('retains standard routes without unwanted modification', () {
      expect(AppRoutes.normalize('/dashboard'), AppRoutes.dashboard);
      expect(AppRoutes.normalize('dashboard'), AppRoutes.dashboard);
      expect(AppRoutes.normalize('/settings'), AppRoutes.settings);
      expect(AppRoutes.normalize('settings'), AppRoutes.settings);
      expect(AppRoutes.normalize('/packaging'), AppRoutes.packaging);
      expect(AppRoutes.normalize('packaging'), AppRoutes.packaging);
      expect(AppRoutes.normalize('/history'), AppRoutes.history);
      expect(AppRoutes.normalize('history'), AppRoutes.history);
      expect(AppRoutes.normalize('/notifications'), AppRoutes.notifications);
      expect(AppRoutes.normalize('notifications'), AppRoutes.notifications);
    });
  });

  group('ApiConfig & Network Resolution Tests', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    test('formatUrl sanitizes IP and hosts with default port and path', () {
      expect(ApiConfig.formatUrl('http://192.168.1.3:8000/api/v1'), 'http://192.168.1.3:8000/api/v1');
      expect(ApiConfig.formatUrl('192.168.1.3'), 'http://192.168.1.3:8000/api/v1');
      expect(ApiConfig.formatUrl('192.168.1.3:8000'), 'http://192.168.1.3:8000/api/v1');
      expect(ApiConfig.formatUrl('http://192.168.1.3/'), 'http://192.168.1.3:8000/api/v1');
      expect(ApiConfig.formatUrl('127.0.0.1'), 'http://127.0.0.1:8000/api/v1');
    });

    test('isValidUrl detects valid and invalid formats', () {
      expect(ApiConfig.isValidUrl('http://127.0.0.1:8000/api/v1'), isTrue);
      expect(ApiConfig.isValidUrl('http://192.168.1.3:8000/api/v1'), isTrue);
      expect(ApiConfig.isValidUrl('192.168.1.3'), isTrue);
      expect(ApiConfig.isValidUrl(''), isFalse);
      expect(ApiConfig.isValidUrl('not a url %%%'), isFalse);
    });

    test('rootOrigin extracts protocol, host, and port correctly', () async {
      await ApiConfig.setBaseUrl('http://192.168.1.3:8000/api/v1');
      expect(ApiConfig.rootOrigin, 'http://192.168.1.3:8000');

      await ApiConfig.setBaseUrl('http://127.0.0.1:8000/api/v1');
      expect(ApiConfig.rootOrigin, 'http://127.0.0.1:8000');
    });

    test('determines connection modes accurately', () async {
      await ApiConfig.setBaseUrl('http://127.0.0.1:8000/api/v1');
      expect(ApiConfig.connectionMode, ApiConnectionMode.usb);
      expect(ApiConfig.isAdbReverseActive, isTrue);

      await ApiConfig.setBaseUrl('http://10.0.2.2:8000/api/v1');
      expect(ApiConfig.connectionMode, ApiConnectionMode.emulator);

      await ApiConfig.setBaseUrl('http://192.168.1.3:8000/api/v1');
      expect(ApiConfig.connectionMode, ApiConnectionMode.lan);

      await ApiConfig.setBaseUrl('https://api.agriguard.lk/api/v1');
      expect(ApiConfig.connectionMode, ApiConnectionMode.custom);
    });

    test('setBaseUrl persists into SharedPreferences', () async {
      await ApiConfig.setBaseUrl('http://192.168.1.3:8000/api/v1');
      expect(ApiConfig.baseUrl, 'http://192.168.1.3:8000/api/v1');

      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getString('agriguard.api_base_url'), 'http://192.168.1.3:8000/api/v1');
    });
  });

  group('Grad-CAM Full URL Assembly Tests', () {
    test('avoids duplicate /api/v1 in fullGradcamUrl', () async {
      await ApiConfig.setBaseUrl('http://192.168.1.3:8000/api/v1');

      final resultWithLeadingApi = DiseaseDetectionResult(
        id: 'test_123',
        diseaseName: 'Black Sigatoka',
        cropType: 'BANANA',
        confidence: 0.94,
        isHealthy: false,
        treatmentGuidance: ['Prune necrotic leaves'],
        gradcamUrl: '/api/v1/diseases/assessments/test_123/gradcam',
      );

      expect(
        resultWithLeadingApi.fullGradcamUrl,
        'http://192.168.1.3:8000/api/v1/diseases/assessments/test_123/gradcam',
      );
      expect(resultWithLeadingApi.fullGradcamUrl, isNot(contains('/api/v1/api/v1/')));
    });

    test('handles full URL returned by backend directly', () async {
      await ApiConfig.setBaseUrl('http://192.168.1.3:8000/api/v1');

      final resultFullUrl = DiseaseDetectionResult(
        id: 'test_456',
        diseaseName: 'Healthy Banana',
        cropType: 'BANANA',
        confidence: 0.99,
        isHealthy: true,
        treatmentGuidance: [],
        gradcamUrl: 'http://192.168.1.3:8000/api/v1/diseases/assessments/test_456/gradcam',
      );

      expect(
        resultFullUrl.fullGradcamUrl,
        'http://192.168.1.3:8000/api/v1/diseases/assessments/test_456/gradcam',
      );
    });
  });

  group('ApiException Friendly Messages Tests', () {
    test('translates NETWORK_ERROR to user friendly guidance', () {
      final exc = ApiException.network(
        'Failed to connect',
        hint: 'Verify backend is running on port 8000',
      );
      expect(exc.code, 'NETWORK_ERROR');
      expect(exc.friendlyMessage, contains('Unable to connect to AgriGuard backend'));
      expect(exc.friendlyMessage, contains('Verify backend is running'));
      expect(exc.toString(), contains('Unable to connect'));
    });

    test('translates AUTH_ERROR to friendly message', () {
      final exc = ApiException.unauthorized('Invalid email or password');
      expect(exc.code, 'AUTH_ERROR');
      expect(exc.friendlyMessage, contains('Invalid email or password'));
    });

    test('translates SERVER_ERROR to friendly message', () {
      final exc = ApiException.server('PyTorch out of memory');
      expect(exc.code, 'SERVER_ERROR');
      expect(exc.friendlyMessage, contains('Server encountered an issue'));
    });
  });

  group('Plant Health Workflow & Route Verification Tests', () {
    test('verifies all Plant Health route aliases normalize correctly', () {
      expect(AppRoutes.normalize('disease'), AppRoutes.diseaseCapture);
      expect(AppRoutes.normalize('/disease'), AppRoutes.diseaseCapture);
      expect(AppRoutes.normalize('/disease/new'), AppRoutes.diseaseCapture);
      expect(AppRoutes.normalize('disease/new'), AppRoutes.diseaseCapture);
      expect(AppRoutes.normalize('disease-capture'), AppRoutes.diseaseCapture);
      expect(AppRoutes.normalize('/disease-capture'), AppRoutes.diseaseCapture);
      expect(AppRoutes.normalize('disease-results'), AppRoutes.diseaseResults);
      expect(AppRoutes.normalize('/disease-results'), AppRoutes.diseaseResults);
      expect(AppRoutes.normalize('/disease/results'), AppRoutes.diseaseResults);
    });

    test('verifies DiseaseDetectionResult parses FastAPI /diseases/detect envelope', () {
      final backendResponseData = {
        'cropType': 'BANANA',
        'diseaseName': 'BANANA___SIGATOKA',
        'diseaseNameDisplay': 'Banana Sigatoka Leaf Spot',
        'predictedDisease': 'Banana Sigatoka Leaf Spot',
        'confidence': 0.8932,
        'severity': 'UNAVAILABLE',
        'severityStatus': 'UNAVAILABLE',
        'managementGuidance': [
          'Cut off badly spotted leaves and remove them from the field.',
          'Spray a recommended systemic fungicide (e.g., Mancozeb or Propiconazole).',
          'Improve drainage so water does not collect around plants.',
        ],
        'guidanceCitation': 'Department of Agriculture Sri Lanka, HORDI Gannoruwa.',
        'gradCamArtifactReference': 'gradcam_plant_17300000_abcdef.png',
        'gradcamAvailable': true,
        'gradcamUrl': '/api/v1/diseases/gradcam/gradcam_plant_17300000_abcdef.png',
        'assessmentId': '674000000000000000000001',
      };

      final parsed = DiseaseDetectionResult.fromJson(backendResponseData);
      expect(parsed.id, '674000000000000000000001');
      expect(parsed.cropType, 'BANANA');
      expect(parsed.displayName, 'Banana Sigatoka Leaf Spot');
      expect(parsed.confidence, 0.8932);
      expect(parsed.isHealthy, isFalse);
      expect(parsed.severityStatus, 'UNAVAILABLE');
      expect(parsed.treatmentGuidance.length, 3);
      expect(parsed.guidanceCitation, contains('Department of Agriculture Sri Lanka'));
      expect(parsed.hasGradcam, isTrue);
      expect(parsed.fullGradcamUrl, contains('gradcam_plant_17300000_abcdef.png'));
    });

    test('verifies truthful severity handling without fabricated scores', () {
      final healthyResult = DiseaseDetectionResult(
        id: 'h1',
        diseaseName: 'Banana Healthy',
        diseaseNameDisplay: 'Healthy Foliage',
        cropType: 'BANANA',
        confidence: 0.98,
        isHealthy: true,
        severityStatus: 'UNAVAILABLE',
      );
      expect(healthyResult.isHealthy, isTrue);
      expect(healthyResult.severityStatus, 'UNAVAILABLE');
    });
  });
}

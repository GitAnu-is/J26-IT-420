import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:agriguard_mobile/core/constants/app_constants.dart';
import 'package:agriguard_mobile/core/models/user_model.dart';
import 'package:agriguard_mobile/core/models/farm_model.dart';
import 'package:agriguard_mobile/core/models/record_model.dart';
import 'package:agriguard_mobile/core/models/crop_model.dart';
import 'package:agriguard_mobile/core/models/disease_model.dart';
import 'package:agriguard_mobile/core/models/transportation_model.dart';
import 'package:agriguard_mobile/l10n/app_localizations.dart';

void main() {
  group('UserModel Tests', () {
    test('parses UserModel from JSON correctly', () {
      final json = {
        'id': 'u123',
        'name': 'Test Officer',
        'email': 'officer@agriguard.lk',
        'role': 'OFFICER',
      };
      final user = UserModel.fromJson(json);
      expect(user.id, 'u123');
      expect(user.name, 'Test Officer');
      expect(user.email, 'officer@agriguard.lk');
      expect(user.role, 'OFFICER');
    });

    test('serializes UserModel to JSON', () {
      final user = UserModel(
        id: 'u456',
        name: 'Transport Operator',
        fullName: 'Transport Operator',
        email: 'trans@agriguard.lk',
        role: AppConstants.roleTransport,
      );
      final json = user.toJson();
      expect(json['id'], 'u456');
      expect(json['role'], 'TRANSPORT_OPERATOR');
    });
  });

  group('FarmModel Tests', () {
    test('parses FarmModel with supported crops', () {
      final json = {
        'id': 'f789',
        'farmName': 'Green Valley',
        'district': 'Kurunegala',
        'acres': 4.5,
        'soilType': 'Sandy Clay Loam',
        'supportedCrops': ['BANANA', 'BLACK_PEPPER'],
      };
      final farm = FarmModel.fromJson(json);
      expect(farm.id, 'f789');
      expect(farm.farmName, 'Green Valley');
      expect(farm.district, 'Kurunegala');
      expect(farm.acres, 4.5);
      expect(farm.supportedCrops, contains('BANANA'));
      expect(farm.supportedCrops, contains('BLACK_PEPPER'));
    });
  });

  group('AgriculturalRecordModel Tests', () {
    test('parses AgriculturalRecordModel and preserves NPK', () {
      final json = {
        'id': 'r1',
        'farmId': 'f789',
        'cropType': 'BANANA',
        'plantingDate': '2026-05-10',
        'expectedHarvestDate': '2026-11-15',
        'soilMoisture': 68.5,
        'soilPh': 6.2,
        'nitrogen': 110,
        'phosphorus': 45,
        'potassium': 160,
        'notes': 'Healthy shoots emerging',
      };
      final record = AgriculturalRecordModel.fromJson(json);
      expect(record.cropType, 'BANANA');
      expect(record.soilPh, 6.2);
      expect(record.nitrogen, 110);
      expect(record.notes, 'Healthy shoots emerging');

      final serialized = record.toJson();
      expect(serialized['cropType'], 'BANANA');
      expect(serialized['plantingDate'], '2026-05-10');
      expect(serialized['expectedHarvestDate'], '2026-11-15');
      expect(serialized['nitrogen'], 110);
    });
  });

  group('Component 1 — Crop & Harvest Planning Models', () {
    test('RecommendCropInput and Result serialization', () {
      final input = RecommendCropInput(
        n: 85,
        p: 42,
        k: 55,
        ph: 6.5,
        rainfall: 140,
        temperature: 28,
        humidity: 78,
        season: 'YALA',
        district: 'Kurunegala',
      );
      final json = input.toJson();
      expect(json['nitrogen'], 85);
      expect(json['phosphorus'], 42);
      expect(json['season'], 'YALA');

      final resultJson = {
        'recommendedCrop': 'BANANA',
        'confidence': 0.92,
        'probabilities': {
          'BANANA': 0.92,
          'PINEAPPLE': 0.05,
          'BLACK_PEPPER': 0.03,
        },
      };
      final result = RecommendCropResult.fromJson(resultJson);
      expect(result.recommendedCrop, 'BANANA');
      expect(result.confidence, 0.92);
      expect(result.probabilities['BANANA'], 0.92);
    });

    test('PredictHarvestInput and Result serialization with reference events', () {
      final input = PredictHarvestInput(
        crop: 'BLACK_PEPPER',
        referenceDate: DateTime(2026, 6, 1),
        district: 'Matale',
      );
      final json = input.toJson();
      expect(json['crop'], 'BLACK_PEPPER');
      expect(json['plantingDate'], '2026-06-01');

      final resultJson = {
        'cropType': 'BLACK_PEPPER',
        'referenceEvent': 'SPIKE_EMERGENCE',
        'referenceDate': '2026-06-01',
        'predictedDurationDays': 180,
        'expectedHarvestDate': '2026-11-28',
        'harvestWindowStart': '2026-11-21',
        'harvestWindowEnd': '2026-12-05',
        'windowDays': 14,
      };
      final res = PredictHarvestResult.fromJson(resultJson);
      expect(res.predictedDurationDays, 180);
      expect(res.referenceEvent, 'SPIKE_EMERGENCE');
    });
  });

  group('Component 2 — Disease Detection Models', () {
    test('DiseaseDetectionResult parsing with Grad-CAM and guidance', () {
      final json = {
        'id': 'diag_999',
        'diseaseName': 'Black Sigatoka',
        'cropType': 'BANANA',
        'confidence': 0.94,
        'isHealthy': false,
        'treatmentGuidance': [
          'De-leaf severely necrotic leaves.',
          'Apply propiconazole fungicide spray.',
        ],
        'gradcamUrl': '/api/v1/diseases/assessments/diag_999/gradcam',
      };
      final result = DiseaseDetectionResult.fromJson(json);
      expect(result.diseaseName, 'Black Sigatoka');
      expect(result.confidence, 0.94);
      expect(result.isHealthy, false);
      expect(result.treatmentGuidance.length, 2);
      expect(result.gradcamUrl, contains('diag_999'));
    });
  });

  group('Component 4 — Transportation Risk & SHAP Attribution Models', () {
    test('TransportationRiskResult parses real SHAP contributions correctly', () {
      final json = {
        'id': 'tr_123',
        'cropType': 'BANANA',
        'riskLevel': 'HIGH',
        'damageProbability': 0.65,
        'topContributors': [
          {
            'featureName': 'road_condition',
            'shapValue': 0.22,
            'description': 'Rough unpaved feeder road increases mechanical damage.',
          },
          {
            'featureName': 'packaging_type',
            'shapValue': -0.18,
            'description': 'Rigid plastic crates mitigate crush load.',
          },
        ],
        'packagingRecommendations': [
          'Stack maximum 4 crates high.',
          'Use corrugated paper pads.',
        ],
        'handlingAdvice': [
          'Avoid dropping cartons during loading.',
        ],
      };

      final result = TransportationRiskResult.fromJson(json);
      expect(result.riskLevel, 'HIGH');
      expect(result.damageProbability, 0.65);
      expect(result.topContributors.length, 2);
      expect(result.topContributors[0].featureName, 'road_condition');
      expect(result.topContributors[0].shapValue, 0.22);
      expect(result.topContributors[1].shapValue, -0.18);
    });

    test('SmartPackagingResult parses packaging standards', () {
      final json = {
        'cropType': 'PINEAPPLE',
        'recommendedPackaging': 'Corrugated Cartons with Dividers',
        'cushioning': 'Foam mesh sleeve on crown',
        'ventilation': 'Vent slots 5% surface area',
        'stacking': 'Max 5 tiers',
        'transportPrecautions': ['Maintain upright orientation'],
      };
      final res = SmartPackagingResult.fromJson(json);
      expect(res.cropType, 'PINEAPPLE');
      expect(res.recommendedPackaging, 'Corrugated Cartons with Dividers');
      expect(res.precautions.first, 'Maintain upright orientation');
    });
  });

  group('Localization Parity Tests', () {
    test('supports English, Sinhala and Tamil key translations', () {
      final en = AppLocalizations(const Locale('en'));
      final si = AppLocalizations(const Locale('si'));
      final ta = AppLocalizations(const Locale('ta'));

      expect(en.appName, 'AgriGuard');
      expect(si.appName, 'AgriGuard');
      expect(ta.appName, 'AgriGuard');

      expect(en.loginTitle, 'Sign in');
      expect(si.loginTitle, 'ඇතුල් වන්න');
      expect(ta.loginTitle, 'உள்நுழைக');

      expect(en.cropBanana, 'Banana');
      expect(si.cropBanana, 'කෙසෙල්');
      expect(ta.cropBanana, 'வாழை');

      // Plant Health workflow translations matching Web UI
      expect(en.checkMyPlant, 'Check my plant for disease');
      expect(si.checkMyPlant, 'මගේ ශාකයේ රෝග පරීක්ෂා කරන්න');
      expect(ta.checkMyPlant, 'என் தாவரத்தில் நோய் உள்ளதா எனச் சோதிக்கவும்');

      expect(en.checkPlant, 'Check this plant');
      expect(si.checkPlant, 'මෙම ශාකය පරීක්ෂා කරන්න');
      expect(ta.checkPlant, 'இந்தத் தாவரத்தைச் சோதி');

      expect(en.checkAnother, 'Check another plant');
      expect(si.checkAnother, 'වෙනත් ශාකයක් පරීක්ෂා කරන්න');
      expect(ta.checkAnother, 'வேறொரு தாவரத்தைச் சோதி');

      expect(en.sevUnavailable, contains('not available'));
      expect(si.sevUnavailable, contains('ලබාගත නොහැක'));
      expect(ta.sevUnavailable, contains('கிடைக்கவில்லை'));
    });

    test('verifies absence of prohibited technical research identifiers in UI getters', () {
      final en = AppLocalizations(const Locale('en'));
      final si = AppLocalizations(const Locale('si'));
      final ta = AppLocalizations(const Locale('ta'));

      for (final l10n in [en, si, ta]) {
        // Assert no 'Component 1', 'Component 2', 'Component 4' in official getters
        expect(l10n.fTransportOfficial, isNot(contains('Component')));
        expect(l10n.fDiseaseOfficial, isNot(contains('Component')));
        expect(l10n.fHarvestOfficial, isNot(contains('Component')));
        expect(l10n.fCropOfficial, isNot(contains('Component')));

        expect(l10n.fTransportOfficial, isNot(contains('C1')));
        expect(l10n.fTransportOfficial, isNot(contains('C2')));
        expect(l10n.fTransportOfficial, isNot(contains('C4')));

        expect(l10n.fDiseaseOfficial, isNot(contains('C1')));
        expect(l10n.fDiseaseOfficial, isNot(contains('C2')));
        expect(l10n.fDiseaseOfficial, isNot(contains('C4')));
      }
    });
  });

  group('Constants & Enumerations Parity Tests', () {
    test('matches research crop list', () {
      expect(AppConstants.supportedCrops, contains('BANANA'));
      expect(AppConstants.supportedCrops, contains('PINEAPPLE'));
      expect(AppConstants.supportedCrops, contains('BLACK_PEPPER'));
      expect(AppConstants.supportedCrops.length, 3);
    });

    test('matches research role list', () {
      expect(AppConstants.roleFarmer, 'FARMER');
      expect(AppConstants.roleOfficer, 'AGRICULTURAL_OFFICER');
      expect(AppConstants.roleTransport, 'TRANSPORT_OPERATOR');
    });
  });
}

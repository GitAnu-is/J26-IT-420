import 'dart:io';
import '../../core/api/api_client.dart';
import '../../core/models/disease_model.dart';

class DiseaseService {
  final ApiClient _apiClient;

  DiseaseService(this._apiClient);

  Future<DiseaseDetectionResult> detectDisease({
    required File imageFile,
    required String cropType,
    String? farmId,
  }) async {
    final fields = {
      'cropType': cropType,
      'crop': cropType,
      if (farmId != null && farmId.isNotEmpty) 'farmId': farmId,
    };

    final res = await _apiClient.uploadMultipart(
      endpoint: '/diseases/detect',
      imageFile: imageFile,
      fields: fields,
    );

    return DiseaseDetectionResult.fromJson(res);
  }

  Future<List<dynamic>> getDiseaseHistory() async {
    final res = await _apiClient.request(
      method: 'GET',
      endpoint: '/diseases/history',
    );
    if (res is List) return res;
    return res?['items'] as List? ?? [];
  }
}

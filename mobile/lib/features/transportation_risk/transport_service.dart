import '../../core/api/api_client.dart';
import '../../core/models/transportation_model.dart';

class TransportService {
  final ApiClient _apiClient;

  TransportService(this._apiClient);

  Future<TransportationRiskResult> predictRisk(PredictTransportationRiskInput input) async {
    final res = await _apiClient.request(
      method: 'POST',
      endpoint: '/transportation/predict-risk',
      body: input.toJson(),
    );
    return TransportationRiskResult.fromJson(res);
  }

  Future<SmartPackagingResult> recommendPackaging({
    required String cropType,
    String? vehicleType,
    double? distanceKm,
  }) async {
    final res = await _apiClient.request(
      method: 'POST',
      endpoint: '/transportation/recommend-packaging',
      body: {
        'cropType': cropType,
        if (vehicleType != null) 'vehicleType': vehicleType,
        if (distanceKm != null) 'distanceKm': distanceKm,
      },
    );
    return SmartPackagingResult.fromJson(res);
  }

  Future<List<dynamic>> getTransportationHistory() async {
    final res = await _apiClient.request(
      method: 'GET',
      endpoint: '/transportation/history',
    );
    if (res is List) return res;
    return res?['items'] as List? ?? [];
  }
}

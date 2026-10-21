import '../../core/api/api_client.dart';
import '../../core/models/crop_model.dart';

class CropService {
  final ApiClient _apiClient;

  CropService(this._apiClient);

  Future<RecommendCropResult> recommendCrop(RecommendCropInput input) async {
    final res = await _apiClient.request(
      method: 'POST',
      endpoint: '/crops/recommend',
      body: input.toJson(),
    );
    return RecommendCropResult.fromJson(res);
  }

  Future<PredictHarvestResult> predictHarvest(PredictHarvestInput input) async {
    final res = await _apiClient.request(
      method: 'POST',
      endpoint: '/crops/predict-harvest',
      body: input.toJson(),
    );
    return PredictHarvestResult.fromJson(res);
  }

  Future<List<dynamic>> getCropHistory() async {
    final res = await _apiClient.request(
      method: 'GET',
      endpoint: '/crops/history',
    );
    if (res is List) return res;
    return res?['items'] as List? ?? [];
  }
}

import '../../core/api/api_client.dart';
import '../../core/models/farm_model.dart';

class FarmService {
  final ApiClient _apiClient;

  FarmService(this._apiClient);

  Future<List<FarmModel>> getFarms() async {
    final res = await _apiClient.request(
      method: 'GET',
      endpoint: '/farms',
    );
    final rawList = res is List ? res : (res?['farms'] as List? ?? []);
    return rawList.map((e) => FarmModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<FarmModel> createFarm(FarmModel farm) async {
    final res = await _apiClient.request(
      method: 'POST',
      endpoint: '/farms',
      body: farm.toJson(),
    );
    final farmData = res is Map<String, dynamic> && res.containsKey('farm') ? res['farm'] : res;
    return FarmModel.fromJson(farmData);
  }

  Future<FarmModel> updateFarm(String id, Map<String, dynamic> updates) async {
    final res = await _apiClient.request(
      method: 'PATCH',
      endpoint: '/farms/$id',
      body: updates,
    );
    final farmData = res is Map<String, dynamic> && res.containsKey('farm') ? res['farm'] : res;
    return FarmModel.fromJson(farmData);
  }

  Future<void> deleteFarm(String id) async {
    await _apiClient.request(
      method: 'DELETE',
      endpoint: '/farms/$id',
    );
  }
}

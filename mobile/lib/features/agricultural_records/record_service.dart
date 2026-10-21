import '../../core/api/api_client.dart';
import '../../core/models/record_model.dart';

class RecordService {
  final ApiClient _apiClient;

  RecordService(this._apiClient);

  Future<List<AgriculturalRecordModel>> getRecords({String? farmId}) async {
    final endpoint = farmId != null && farmId.isNotEmpty ? '/records?farmId=$farmId' : '/records';
    final res = await _apiClient.request(
      method: 'GET',
      endpoint: endpoint,
    );
    final rawList = res is List ? res : (res?['records'] as List? ?? []);
    return rawList.map((e) => AgriculturalRecordModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<AgriculturalRecordModel> getRecordById(String id) async {
    final res = await _apiClient.request(
      method: 'GET',
      endpoint: '/records/$id',
    );
    final recData = res is Map<String, dynamic> && res.containsKey('record') ? res['record'] : res;
    return AgriculturalRecordModel.fromJson(recData);
  }

  Future<AgriculturalRecordModel> createRecord(AgriculturalRecordModel record) async {
    final res = await _apiClient.request(
      method: 'POST',
      endpoint: '/records',
      body: record.toJson(),
    );
    final recData = res is Map<String, dynamic> && res.containsKey('record') ? res['record'] : res;
    return AgriculturalRecordModel.fromJson(recData);
  }

  Future<AgriculturalRecordModel> updateRecord(String id, Map<String, dynamic> updates) async {
    final res = await _apiClient.request(
      method: 'PATCH',
      endpoint: '/records/$id',
      body: updates,
    );
    final recData = res is Map<String, dynamic> && res.containsKey('record') ? res['record'] : res;
    return AgriculturalRecordModel.fromJson(recData);
  }

  Future<void> deleteRecord(String id) async {
    await _apiClient.request(
      method: 'DELETE',
      endpoint: '/records/$id',
    );
  }
}

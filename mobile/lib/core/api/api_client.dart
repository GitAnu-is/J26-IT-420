import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'api_config.dart';
import 'api_exception.dart';
import '../auth/token_storage.dart';

class ApiClient {
  final http.Client _client = http.Client();
  final TokenStorage _tokenStorage = TokenStorage();
  VoidCallback? onUnauthorized;

  Map<String, String> _defaultHeaders(String? token) {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<dynamic> request({
    required String method,
    required String endpoint,
    dynamic body,
    bool requiresAuth = true,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    String? token;
    if (requiresAuth) {
      token = await _tokenStorage.getAccessToken();
    }

    http.Response response;
    try {
      final headers = _defaultHeaders(token);
      final encodedBody = body != null ? jsonEncode(body) : null;

      switch (method.toUpperCase()) {
        case 'GET':
          response = await _client.get(uri, headers: headers).timeout(ApiConfig.connectTimeout);
          break;
        case 'POST':
          response = await _client.post(uri, headers: headers, body: encodedBody).timeout(ApiConfig.inferenceTimeout);
          break;
        case 'PATCH':
          response = await _client.patch(uri, headers: headers, body: encodedBody).timeout(ApiConfig.connectTimeout);
          break;
        case 'DELETE':
          response = await _client.delete(uri, headers: headers).timeout(ApiConfig.connectTimeout);
          break;
        default:
          throw Exception('Unsupported HTTP method: $method');
      }
    } on SocketException catch (_) {
      final isUsb = ApiConfig.baseUrl.contains('127.0.0.1') || ApiConfig.baseUrl.contains('localhost');
      final hint = isUsb
          ? 'USB mode active: Please run "adb -s 9LIVNB7PHQJVAQGI reverse tcp:8000 tcp:8000" on your laptop, or tap the server settings icon to switch to Wi-Fi LAN mode.'
          : 'LAN mode active: Ensure your phone and laptop are on the same Wi-Fi network and backend is running on port 8000.';
      throw ApiException(
        statusCode: 0,
        code: 'NETWORK_ERROR',
        message: 'Cannot connect to AgriGuard backend at ${ApiConfig.baseUrl}.\n\n$hint',
      );
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(statusCode: 0, code: 'CLIENT_ERROR', message: e.toString());
    }

    // Auto-refresh token if 401 Unauthorized
    if (response.statusCode == 401 && requiresAuth) {
      final refreshed = await _tryRefreshToken();
      if (refreshed) {
        return request(method: method, endpoint: endpoint, body: body, requiresAuth: true);
      } else {
        await _tokenStorage.clear();
        onUnauthorized?.call();
        throw ApiException(
          statusCode: 401,
          code: 'UNAUTHORIZED',
          message: 'Your session has expired. Please log in again.',
        );
      }
    }

    return _processResponse(response);
  }

  /// Multipart image upload for Component 2 (Disease diagnosis)
  Future<dynamic> uploadMultipart({
    required String endpoint,
    required File imageFile,
    required Map<String, String> fields,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final token = await _tokenStorage.getAccessToken();

    try {
      final request = http.MultipartRequest('POST', uri);
      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }
      request.fields.addAll(fields);

      request.files.add(
        await http.MultipartFile.fromPath(
          'image', // Field expected by FastAPI router
          imageFile.path,
        ),
      );

      final streamedResponse = await request.send().timeout(ApiConfig.inferenceTimeout);
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 401) {
        final refreshed = await _tryRefreshToken();
        if (refreshed) {
          return await uploadMultipart(endpoint: endpoint, imageFile: imageFile, fields: fields);
        } else {
          await _tokenStorage.clear();
          onUnauthorized?.call();
        }
      }

      return _processResponse(response);
    } on SocketException catch (_) {
      throw ApiException(
        statusCode: 0,
        code: 'NETWORK_ERROR',
        message: 'Cannot upload leaf image to AgriGuard backend at ${ApiConfig.baseUrl}. Please verify Wi-Fi or server connectivity.',
      );
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(statusCode: 0, code: 'UPLOAD_ERROR', message: e.toString());
    }
  }

  Future<bool> _tryRefreshToken() async {
    final refreshToken = await _tokenStorage.getRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) return false;

    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}/auth/refresh');
      final res = await _client.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refreshToken}),
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final newAccessToken = data['data']?['accessToken'] ?? data['accessToken'];
        final newRefreshToken = data['data']?['refreshToken'] ?? data['refreshToken'];
        if (newAccessToken != null) {
          await _tokenStorage.saveTokens(
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          );
          return true;
        }
      }
    } catch (_) {}
    return false;
  }

  dynamic _processResponse(http.Response response) {
    dynamic json;
    try {
      json = jsonDecode(utf8.decode(response.bodyBytes));
    } catch (_) {
      json = null;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      // Unpack envelope: backend returns { "success": true, "data": ... } or direct map
      if (json is Map<String, dynamic> && json.containsKey('data')) {
        return json['data'];
      }
      return json;
    }

    if (json is Map<String, dynamic>) {
      throw ApiException.fromJson(response.statusCode, json);
    }

    throw ApiException(
      statusCode: response.statusCode,
      code: 'HTTP_${response.statusCode}',
      message: response.body.isNotEmpty ? response.body : 'Server returned error status ${response.statusCode}',
    );
  }

  Future<bool> healthCheck() async {
    try {
      final res = await request(
        method: 'GET',
        endpoint: '/health',
        requiresAuth: false,
      );
      return res != null;
    } catch (_) {
      return false;
    }
  }
}

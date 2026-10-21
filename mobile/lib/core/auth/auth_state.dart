import 'package:flutter/material.dart';
import '../api/api_client.dart';
import '../models/user_model.dart';
import 'token_storage.dart';

class AuthState extends ChangeNotifier {
  final ApiClient _apiClient;
  final TokenStorage _tokenStorage = TokenStorage();

  UserModel? _user;
  bool _isLoading = true;
  String? _errorMessage;

  AuthState(this._apiClient) {
    _apiClient.onUnauthorized = _handleUnauthorized;
    restoreSession();
  }

  UserModel? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String get role => _user?.normalizedRole ?? 'FARMER';

  void _handleUnauthorized() {
    _user = null;
    notifyListeners();
  }

  Future<void> restoreSession() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await _tokenStorage.getAccessToken();
      if (token != null && token.isNotEmpty) {
        final profile = await _apiClient.request(
          method: 'GET',
          endpoint: '/auth/me',
          requiresAuth: true,
        );
        final userData = profile is Map<String, dynamic> && profile.containsKey('user')
            ? profile['user']
            : profile;
        _user = UserModel.fromJson(userData);
      }
    } catch (_) {
      // Session restored from cache or cleared
      final cached = await _tokenStorage.getUserProfile();
      if (cached['role'] != null) {
        _user = UserModel(
          id: 'cached',
          name: cached['name'] ?? '',
          fullName: cached['name'] ?? '',
          email: cached['email'] ?? '',
          role: cached['role'] ?? 'FARMER',
        );
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _apiClient.request(
        method: 'POST',
        endpoint: '/auth/login',
        body: {'email': email.trim(), 'password': password},
        requiresAuth: false,
      );

      final accessToken = res['accessToken'] ?? res['token'] ?? '';
      final refreshToken = res['refreshToken'];
      await _tokenStorage.saveTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
      );

      final userData = res['user'] ?? res;
      _user = UserModel.fromJson(userData);
      await _tokenStorage.saveUserProfile(
        role: _user!.role,
        name: _user!.fullName,
        email: _user!.email,
      );
    } catch (e) {
      _errorMessage = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> register({
    required String fullName,
    required String email,
    required String role,
    required String password,
    String? phoneNumber,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await _apiClient.request(
        method: 'POST',
        endpoint: '/auth/register',
        body: {
          'fullName': fullName.trim(),
          'name': fullName.trim(),
          'email': email.trim(),
          'role': role,
          'password': password,
          if (phoneNumber != null && phoneNumber.isNotEmpty) 'phoneNumber': phoneNumber,
        },
        requiresAuth: false,
      );

      final accessToken = res['accessToken'] ?? res['token'] ?? '';
      final refreshToken = res['refreshToken'];
      await _tokenStorage.saveTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
      );

      final userData = res['user'] ?? res;
      _user = UserModel.fromJson(userData);
      await _tokenStorage.saveUserProfile(
        role: _user!.role,
        name: _user!.fullName,
        email: _user!.email,
      );
    } catch (e) {
      _errorMessage = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    try {
      final refreshToken = await _tokenStorage.getRefreshToken();
      if (refreshToken != null) {
        await _apiClient.request(
          method: 'POST',
          endpoint: '/auth/logout',
          body: {'refreshToken': refreshToken},
          requiresAuth: true,
        );
      }
    } catch (_) {}
    await _tokenStorage.clear();
    _user = null;
    notifyListeners();
  }
}

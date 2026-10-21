import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class TokenStorage {
  static const String _accessTokenKey = 'agriguard.token';
  static const String _refreshTokenKey = 'agriguard.refreshToken';
  static const String _userRoleKey = 'agriguard.userRole';
  static const String _userNameKey = 'agriguard.userName';
  static const String _userEmailKey = 'agriguard.userEmail';

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  Future<void> saveTokens({required String accessToken, String? refreshToken}) async {
    try {
      await _secureStorage.write(key: _accessTokenKey, value: accessToken);
      if (refreshToken != null && refreshToken.isNotEmpty) {
        await _secureStorage.write(key: _refreshTokenKey, value: refreshToken);
      }
    } catch (_) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_accessTokenKey, accessToken);
      if (refreshToken != null) {
        await prefs.setString(_refreshTokenKey, refreshToken);
      }
    }
  }

  Future<String?> getAccessToken() async {
    try {
      final token = await _secureStorage.read(key: _accessTokenKey);
      if (token != null) return token;
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_accessTokenKey);
  }

  Future<String?> getRefreshToken() async {
    try {
      final token = await _secureStorage.read(key: _refreshTokenKey);
      if (token != null) return token;
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_refreshTokenKey);
  }

  Future<void> saveUserProfile({required String role, required String name, required String email}) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userRoleKey, role);
    await prefs.setString(_userNameKey, name);
    await prefs.setString(_userEmailKey, email);
  }

  Future<Map<String, String?>> getUserProfile() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'role': prefs.getString(_userRoleKey),
      'name': prefs.getString(_userNameKey),
      'email': prefs.getString(_userEmailKey),
    };
  }

  Future<void> clear() async {
    try {
      await _secureStorage.deleteAll();
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessTokenKey);
    await prefs.remove(_refreshTokenKey);
    await prefs.remove(_userRoleKey);
    await prefs.remove(_userNameKey);
    await prefs.remove(_userEmailKey);
  }
}

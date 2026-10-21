import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

enum ApiConnectionMode {
  usb,
  lan,
  emulator,
  custom;

  String get displayName {
    switch (this) {
      case ApiConnectionMode.usb:
        return 'USB (ADB Reverse tcp:8000)';
      case ApiConnectionMode.lan:
        return 'Wi-Fi LAN';
      case ApiConnectionMode.emulator:
        return 'Android Emulator';
      case ApiConnectionMode.custom:
        return 'Custom URL';
    }
  }
}

class ApiConfig {
  static const String _prefKeyBaseUrl = 'agriguard.api_base_url';
  static const String _prefKeyMode = 'agriguard.api_connection_mode';
  static const String _prefKeyLastBuildUrl = 'agriguard.last_build_base_url';

  /// Default URL for physical device via active ADB reverse tunnel (tcp:8000)
  static const String defaultUsbUrl = 'http://127.0.0.1:8000/api/v1';

  /// Default URL for physical device on the same local Wi-Fi LAN
  /// Verified current development host IPv4: 192.168.1.3
  static const String defaultLanUrl = 'http://192.168.1.3:8000/api/v1';

  /// Default URL for Android Emulator
  static const String defaultEmulatorUrl = 'http://10.0.2.2:8000/api/v1';

  /// Compile-time configuration:
  /// flutter run --dart-define=API_BASE_URL=http://192.168.1.3:8000/api/v1
  static const String _envBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: defaultUsbUrl,
  );

  static String _activeBaseUrl = _envBaseUrl;
  static ApiConnectionMode _currentMode = ApiConnectionMode.usb;
  static bool _isInitialized = false;

  static String get baseUrl => _activeBaseUrl;
  static ApiConnectionMode get currentMode => _currentMode;
  static ApiConnectionMode get connectionMode => _currentMode;
  static bool get isAdbReverseActive => _currentMode == ApiConnectionMode.usb;
  static bool get isInitialized => _isInitialized;

  /// Returns the host origin (e.g., http://192.168.1.3:8000) without /api/v1
  static String get rootOrigin {
    return _activeBaseUrl.replaceAll(RegExp(r'/api/v1/?$'), '');
  }

  /// Initialize configuration from persistent storage on app startup.
  /// Precedence rules:
  /// 1. If build-time --dart-define=API_BASE_URL was supplied and is different from default
  ///    AND different from last build, use and persist it.
  /// 2. If user saved an explicit URL in SharedPreferences, use it.
  /// 3. Otherwise fall back to environment default (USB reverse tunnel).
  static Future<void> init() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      final lastBuildUrl = prefs.getString(_prefKeyLastBuildUrl);
      final hasExplicitEnvUrl = _envBaseUrl.isNotEmpty && _envBaseUrl != defaultUsbUrl;

      // If developer passed a new --dart-define, honor it over stale cache
      if (hasExplicitEnvUrl && _envBaseUrl != lastBuildUrl) {
        _activeBaseUrl = formatUrl(_envBaseUrl);
        _currentMode = _detectMode(_activeBaseUrl);
        await prefs.setString(_prefKeyBaseUrl, _activeBaseUrl);
        await prefs.setString(_prefKeyMode, _currentMode.name);
        await prefs.setString(_prefKeyLastBuildUrl, _envBaseUrl);
        _isInitialized = true;
        debugPrint('[ApiConfig] Using new build-time URL: $_activeBaseUrl (mode: $_currentMode)');
        return;
      }

      // Check user-persisted preference
      final savedUrl = prefs.getString(_prefKeyBaseUrl);
      final savedModeStr = prefs.getString(_prefKeyMode);

      if (savedUrl != null && isValidUrl(savedUrl)) {
        _activeBaseUrl = formatUrl(savedUrl);
        if (savedModeStr != null) {
          _currentMode = ApiConnectionMode.values.firstWhere(
            (m) => m.name == savedModeStr,
            orElse: () => _detectMode(_activeBaseUrl),
          );
        } else {
          _currentMode = _detectMode(_activeBaseUrl);
        }
        _isInitialized = true;
        debugPrint('[ApiConfig] Loaded persisted URL: $_activeBaseUrl (mode: $_currentMode)');
        return;
      }

      // Default fallback
      _activeBaseUrl = formatUrl(_envBaseUrl);
      _currentMode = _detectMode(_activeBaseUrl);
      _isInitialized = true;
      debugPrint('[ApiConfig] Defaulting to URL: $_activeBaseUrl (mode: $_currentMode)');
    } catch (e) {
      debugPrint('[ApiConfig] Init exception, falling back to default: $e');
      _activeBaseUrl = defaultUsbUrl;
      _currentMode = ApiConnectionMode.usb;
      _isInitialized = true;
    }
  }

  /// Validates whether a given string is a syntactically valid HTTP/HTTPS URL
  static bool isValidUrl(String raw) {
    final trimmed = raw.trim();
    if (trimmed.isEmpty) return false;
    if (trimmed.contains(' ') || trimmed.contains('\n') || trimmed.contains('\t')) return false;

    final withScheme = trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : 'http://$trimmed';

    final uri = Uri.tryParse(withScheme);
    if (uri == null) return false;
    if (uri.scheme != 'http' && uri.scheme != 'https') return false;
    if (uri.host.isEmpty) return false;
    if (RegExp(r'[^\w\.-]').hasMatch(uri.host)) return false;
    return true;
  }

  /// Formats and ensures consistent http:// scheme, default port 8000 if host-only, and /api/v1 suffix
  static String formatUrl(String raw) {
    var trimmed = raw.trim().replaceAll(RegExp(r'/+$'), '');
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      trimmed = 'http://$trimmed';
    }

    final uri = Uri.tryParse(trimmed);
    if (uri != null && !uri.hasPort) {
      final scheme = uri.scheme;
      final host = uri.host;
      var path = uri.path;
      if (path.isEmpty || path == '/') {
        trimmed = '$scheme://$host:8000';
      } else {
        trimmed = '$scheme://$host:8000$path';
      }
    }

    if (!trimmed.endsWith('/api/v1')) {
      if (trimmed.endsWith('/api')) {
        trimmed = '$trimmed/v1';
      } else {
        trimmed = '$trimmed/api/v1';
      }
    }
    return trimmed;
  }

  /// Update the base URL dynamically and persist it
  static Future<bool> setBaseUrl(String newUrl, {ApiConnectionMode? mode}) async {
    if (!isValidUrl(newUrl)) {
      return false;
    }

    final formatted = formatUrl(newUrl);
    _activeBaseUrl = formatted;
    _currentMode = mode ?? _detectMode(formatted);

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefKeyBaseUrl, formatted);
      await prefs.setString(_prefKeyMode, _currentMode.name);
    } catch (e) {
      debugPrint('[ApiConfig] Failed to persist URL preference: $e');
    }

    debugPrint('[ApiConfig] Active Base URL updated to: $_activeBaseUrl (mode: $_currentMode)');
    return true;
  }

  /// Switch connection mode directly (USB, LAN, Emulator)
  static Future<void> setConnectionMode(ApiConnectionMode mode) async {
    switch (mode) {
      case ApiConnectionMode.usb:
        await setBaseUrl(defaultUsbUrl, mode: ApiConnectionMode.usb);
        break;
      case ApiConnectionMode.lan:
        await setBaseUrl(defaultLanUrl, mode: ApiConnectionMode.lan);
        break;
      case ApiConnectionMode.emulator:
        await setBaseUrl(defaultEmulatorUrl, mode: ApiConnectionMode.emulator);
        break;
      case ApiConnectionMode.custom:
        _currentMode = ApiConnectionMode.custom;
        break;
    }
  }

  /// Reset to factory default (USB reverse tunnel)
  static Future<void> resetToDefault() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_prefKeyBaseUrl);
      await prefs.remove(_prefKeyMode);
    } catch (_) {}
    _activeBaseUrl = defaultUsbUrl;
    _currentMode = ApiConnectionMode.usb;
  }

  static ApiConnectionMode _detectMode(String url) {
    if (url.contains('127.0.0.1') || url.contains('localhost')) {
      return ApiConnectionMode.usb;
    }
    if (url.contains('10.0.2.2')) {
      return ApiConnectionMode.emulator;
    }
    if (url.contains('192.168.') || url.contains('10.') || url.contains('172.')) {
      return ApiConnectionMode.lan;
    }
    return ApiConnectionMode.custom;
  }

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration inferenceTimeout = Duration(seconds: 60); // AI models inference
}

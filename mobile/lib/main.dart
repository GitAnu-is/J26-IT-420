import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app/app.dart';
import 'core/auth/auth_state.dart';
import 'core/api/api_client.dart';
import 'core/api/api_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  // Initialize persistent API configuration (USB / LAN / Custom)
  await ApiConfig.init();

  // Initialize API client and auth state
  final apiClient = ApiClient();
  final authState = AuthState(apiClient);

  // Restore session if token exists
  await authState.restoreSession();

  runApp(
    AgriGuardApp(
      authState: authState,
      apiClient: apiClient,
    ),
  );
}

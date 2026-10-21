import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../core/auth/auth_state.dart';
import '../core/api/api_client.dart';
import '../features/farms/farm_service.dart';
import '../features/agricultural_records/record_service.dart';
import '../l10n/app_localizations.dart';
import 'routes.dart';
import 'router.dart';

class AgriGuardApp extends StatelessWidget {
  final AuthState authState;
  final ApiClient apiClient;

  const AgriGuardApp({
    super.key,
    required this.authState,
    required this.apiClient,
  });

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthState>.value(value: authState),
        Provider<ApiClient>.value(value: apiClient),
        Provider<FarmService>(create: (ctx) => FarmService(ctx.read<ApiClient>())),
        Provider<RecordService>(create: (ctx) => RecordService(ctx.read<ApiClient>())),
        ChangeNotifierProvider<AppLocalizations>(
          create: (_) => AppLocalizations(const Locale('en')),
        ),
      ],
      child: Consumer<AppLocalizations>(
        builder: (context, l10n, child) {
          return MaterialApp(
            title: 'Agri Guard',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            locale: l10n.locale,
            supportedLocales: const [
              Locale('en', ''),
              Locale('si', ''),
              Locale('ta', ''),
            ],
            localizationsDelegates: const [
              AppLocalizationsDelegate(),
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            initialRoute: authState.isAuthenticated ? AppRoutes.dashboard : AppRoutes.splash,
            onGenerateRoute: AppRouter.onGenerateRoute,
          );
        },
      ),
    );
  }
}

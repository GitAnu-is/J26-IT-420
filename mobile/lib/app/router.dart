import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/auth/auth_state.dart';
import '../core/models/farm_model.dart';
import '../core/models/record_model.dart';
import '../core/models/crop_model.dart';
import '../core/models/disease_model.dart';
import '../core/models/transportation_model.dart';
import '../core/widgets/bottom_nav.dart';
import '../l10n/app_localizations.dart';

import 'routes.dart';
import '../features/farms/farm_service.dart';
import '../features/agricultural_records/record_service.dart';
import '../features/onboarding/splash_screen.dart';
import '../features/onboarding/language_select_screen.dart';
import '../features/authentication/login_screen.dart';
import '../features/authentication/register_screen.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/farms/farms_screen.dart';
import '../features/farms/farm_form_screen.dart';
import '../features/farms/farm_detail_screen.dart';
import '../features/agricultural_records/records_screen.dart';
import '../features/agricultural_records/record_form_screen.dart';
import '../features/crop_recommendation/crop_form_screen.dart';
import '../features/crop_recommendation/crop_results_screen.dart';
import '../features/harvest_planning/harvest_form_screen.dart';
import '../features/harvest_planning/harvest_results_screen.dart';
import '../features/disease_detection/disease_capture_screen.dart';
import '../features/disease_detection/disease_results_screen.dart';
import '../features/transportation_risk/transport_form_screen.dart';
import '../features/transportation_risk/transport_results_screen.dart';
import '../features/smart_packaging/smart_packaging_screen.dart';
import '../features/assessment_history/history_screen.dart';
import '../features/settings/settings_screen.dart';
import '../features/settings/more_screen.dart';
import '../features/notifications/notifications_screen.dart';

class AppRouter {
  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    Map<String, dynamic> args = {};
    if (settings.arguments is Map) {
      args = Map<String, dynamic>.from(settings.arguments as Map);
    }
    final rawName = settings.name ?? '/';
    final routeName = AppRoutes.normalize(rawName);

    switch (routeName) {
      case '/':
      case AppRoutes.splash:
        return MaterialPageRoute(
          builder: (context) {
            final auth = context.read<AuthState>();
            return SplashScreen(
              onGetStarted: () {
                if (auth.isAuthenticated) {
                  Navigator.of(context).pushReplacementNamed(AppRoutes.dashboard);
                } else {
                  Navigator.of(context).pushReplacementNamed(AppRoutes.language);
                }
              },
            );
          },
        );

      case AppRoutes.language:
        return MaterialPageRoute(
          builder: (context) {
            final l10n = Provider.of<AppLocalizations>(context, listen: false);
            return LanguageSelectScreen(
              currentLocale: l10n.locale,
              onLocaleChanged: (loc) => l10n.setLocale(loc),
              onContinue: () => Navigator.of(context).pushReplacementNamed(AppRoutes.login),
            );
          },
        );

      case AppRoutes.login:
        return MaterialPageRoute(
          builder: (context) => LoginScreen(
            authState: context.read<AuthState>(),
            onRegisterTap: () => Navigator.of(context).pushNamed(AppRoutes.register),
            onLoginSuccess: () => Navigator.of(context).pushReplacementNamed(AppRoutes.dashboard),
          ),
        );

      case AppRoutes.register:
        return MaterialPageRoute(
          builder: (context) => RegisterScreen(
            authState: context.read<AuthState>(),
            onLoginTap: () => Navigator.of(context).pushReplacementNamed(AppRoutes.login),
            onRegisterSuccess: () => Navigator.of(context).pushReplacementNamed(AppRoutes.dashboard),
          ),
        );

      case AppRoutes.dashboard:
        return MaterialPageRoute(
          builder: (context) => DashboardScreen(
            farmService: context.read<FarmService>(),
            recordService: context.read<RecordService>(),
            activeTab: NavTab.home,
            onTabSelected: (tab) {
              if (tab == NavTab.crop) Navigator.of(context).pushNamed(AppRoutes.cropForm);
              if (tab == NavTab.disease) Navigator.of(context).pushNamed(AppRoutes.diseaseCapture);
              if (tab == NavTab.harvest) Navigator.of(context).pushNamed(AppRoutes.harvestForm);
              if (tab == NavTab.transport) Navigator.of(context).pushNamed(AppRoutes.transportForm);
              if (tab == NavTab.packaging) Navigator.of(context).pushNamed(AppRoutes.packaging);
              if (tab == NavTab.history) Navigator.of(context).pushNamed(AppRoutes.history);
              if (tab == NavTab.more) Navigator.of(context).pushNamed(AppRoutes.more);
            },
            onNavigate: (route, [p]) {
              Navigator.of(context).pushNamed(AppRoutes.normalize(route), arguments: p);
            },
          ),
        );

      case AppRoutes.farms:
        return MaterialPageRoute(
          builder: (context) => FarmsScreen(
            farmService: context.read<FarmService>(),
            onNavigate: (route, [p]) {
              Navigator.of(context).pushNamed(AppRoutes.normalize(route), arguments: p);
            },
          ),
        );

      case AppRoutes.farmNew:
      case '/farm-form':
        return MaterialPageRoute(
          builder: (context) => FarmFormScreen(
            farmService: context.read<FarmService>(),
            onSaved: () => Navigator.of(context).pop(true),
          ),
        );

      case AppRoutes.farmEdit:
        return MaterialPageRoute(
          builder: (context) => FarmFormScreen(
            farmService: context.read<FarmService>(),
            farmToEdit: args['farm'] as FarmModel?,
            onSaved: () => Navigator.of(context).pop(true),
          ),
        );

      case AppRoutes.farmDetail:
      case '/farm-detail':
        final farm = args['farm'] as FarmModel?;
        if (farm == null) {
          return MaterialPageRoute(
            builder: (context) => Scaffold(
              appBar: AppBar(title: const Text('Farm Detail')),
              body: const Center(child: Text('No farm data provided.')),
            ),
          );
        }
        return MaterialPageRoute(
          builder: (context) => FarmDetailScreen(
            farm: farm,
            farmService: context.read<FarmService>(),
            onEdit: () => Navigator.of(context).pushNamed(AppRoutes.farmEdit, arguments: {'farm': farm}),
            onDeleted: () => Navigator.of(context).pop(true),
            onNavigate: (route, [p]) => Navigator.of(context).pushNamed(AppRoutes.normalize(route), arguments: p),
          ),
        );

      case AppRoutes.records:
        return MaterialPageRoute(builder: (_) => const RecordsScreen());

      case AppRoutes.recordNew:
        return MaterialPageRoute(
          builder: (_) => RecordFormScreen(
            presetFarmId: args['farmId'] as String?,
            initialCrop: args['crop'] as String?,
            initialPlantingDate: args['plantingDate'] as DateTime?,
            initialExpectedHarvestDate: (args['expectedHarvest'] ?? args['expectedHarvestDate']) as DateTime?,
          ),
        );

      case AppRoutes.recordEdit:
        return MaterialPageRoute(
          builder: (_) => RecordFormScreen(
            recordId: args['id'] as String?,
            initialRecord: args['record'] as AgriculturalRecordModel?,
          ),
        );

      case AppRoutes.crop:
      case AppRoutes.cropForm:
        return MaterialPageRoute(
          builder: (_) => CropFormScreen(
            presetFarmId: args['farmId'] as String?,
          ),
        );

      case AppRoutes.cropResults:
        return MaterialPageRoute(
          builder: (_) => CropResultsScreen(
            result: args['result'] as RecommendCropResult?,
            crop: args['crop'] as String?,
          ),
        );

      case AppRoutes.harvest:
      case AppRoutes.harvestForm:
        return MaterialPageRoute(
          builder: (_) => HarvestFormScreen(
            initialCrop: args['crop'] as String?,
          ),
        );

      case AppRoutes.harvestResults:
        return MaterialPageRoute(
          builder: (_) => HarvestResultsScreen(
            result: args['result'] as PredictHarvestResult?,
            crop: args['crop'] as String?,
            referenceDate: args['referenceDate'] as DateTime?,
          ),
        );

      case AppRoutes.disease:
      case AppRoutes.diseaseCapture:
        return MaterialPageRoute(
          settings: settings,
          builder: (_) => DiseaseCaptureScreen(
            initialCrop: args['crop'] as String?,
          ),
        );

      case AppRoutes.diseaseResults:
        return MaterialPageRoute(
          settings: settings,
          builder: (_) => DiseaseResultsScreen(
            result: args['result'] as DiseaseDetectionResult?,
            imageFile: args['imageFile'] as File?,
            crop: args['crop'] as String?,
          ),
        );

      case AppRoutes.transport:
      case AppRoutes.transportForm:
        return MaterialPageRoute(
          builder: (_) => TransportFormScreen(
            initialCrop: args['crop'] as String?,
          ),
        );

      case AppRoutes.transportResults:
        return MaterialPageRoute(
          builder: (_) => TransportResultsScreen(
            result: args['result'] as TransportationRiskResult?,
            crop: args['crop'] as String?,
            input: args['input'] as PredictTransportationRiskInput?,
          ),
        );

      case AppRoutes.packaging:
        return MaterialPageRoute(
          builder: (_) => SmartPackagingScreen(
            initialCrop: args['crop'] as String?,
          ),
        );

      case AppRoutes.history:
        return MaterialPageRoute(
          builder: (_) => HistoryScreen(
            initialFilter: args['filter'] as String?,
          ),
        );

      case AppRoutes.settings:
        return MaterialPageRoute(builder: (_) => const SettingsScreen());

      case AppRoutes.more:
        return MaterialPageRoute(builder: (_) => const MoreScreen());

      case AppRoutes.notifications:
        return MaterialPageRoute(builder: (_) => const NotificationsScreen());

      default:
        return MaterialPageRoute(
          builder: (context) => Scaffold(
            appBar: AppBar(title: const Text('Navigation Error')),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline, size: 48, color: Colors.orange),
                    const SizedBox(height: 16),
                    Text(
                      'Route not found: ${settings.name}',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () => Navigator.of(context).pushReplacementNamed(AppRoutes.dashboard),
                      child: const Text('Return to Dashboard'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
    }
  }
}

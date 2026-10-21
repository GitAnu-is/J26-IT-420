import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:agriguard_mobile/core/constants/app_constants.dart';
import 'package:agriguard_mobile/core/models/farm_model.dart';
import 'package:agriguard_mobile/core/models/record_model.dart';
import 'package:agriguard_mobile/core/models/user_model.dart';
import 'package:agriguard_mobile/core/widgets/bottom_nav.dart';
import 'package:agriguard_mobile/core/widgets/screen_layout.dart';
import 'package:agriguard_mobile/features/dashboard/widgets/officer_dashboard_view.dart';
import 'package:agriguard_mobile/l10n/app_localizations.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final testOfficer = UserModel(
    id: 'u_ao_01',
    name: 'Officer Vishmitha',
    fullName: 'Officer Vishmitha Bandara',
    email: 'vishmitha.officer@agriguard.lk',
    role: AppConstants.roleOfficer,
  );

  final List<FarmModel> testFarms = [
    FarmModel(
      id: 'f_01',
      farmName: 'Kurunegala Organic Plantation',
      district: 'Kurunegala',
      area: 5.0,
      soilType: 'Red Yellow Podzolic',
      supportedCrops: ['BANANA', 'BLACK_PEPPER'],
    ),
  ];

  final List<AgriculturalRecordModel> testRecords = [
    AgriculturalRecordModel(
      id: 'r_01',
      farmId: 'f_01',
      cropType: 'BANANA',
      plantingDate: DateTime(2026, 1, 15),
      expectedHarvestDate: DateTime(2026, 11, 20),
      nitrogen: 85,
      phosphorus: 42,
      potassium: 195,
      soilPh: 6.4,
    ),
  ];

  Widget buildOfficerDashboardHarness({
    required Size screenSize,
    double textScaleFactor = 1.0,
  }) {
    return MediaQuery(
      data: MediaQueryData(
        size: screenSize,
        textScaler: TextScaler.linear(textScaleFactor),
      ),
      child: MaterialApp(
        localizationsDelegates: const [
          AppLocalizations.delegate,
          DefaultMaterialLocalizations.delegate,
          DefaultWidgetsLocalizations.delegate,
        ],
        supportedLocales: AppLocalizations.supportedLocales,
        home: Scaffold(
          body: ScreenLayout(
            bottomNavigationBar: BottomNav(
              activeTab: NavTab.home,
              onTabSelected: (_) {},
              userRole: 'AGRICULTURAL_OFFICER',
            ),
            body: OfficerDashboardView(
              user: testOfficer,
              farms: testFarms,
              records: testRecords,
              onNavigate: (_) {},
            ),
          ),
        ),
      ),
    );
  }

  group('Agricultural Officer Dashboard Responsive Layout Tests', () {
    const screenWidths = [
      Size(320, 700), // Narrow viewport (e.g., small phones)
      Size(360, 800), // Standard Android viewport (e.g. Redmi 23129RN51X)
      Size(393, 852), // Modern mid-tier flagship width
      Size(412, 915), // Large Android phone width (Pixel 7/8/9 Pro)
    ];

    for (final size in screenWidths) {
      testWidgets('renders cleanly without overflow at ${size.width.toInt()}px width', (tester) async {
        tester.view.physicalSize = Size(size.width, size.height);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);

        await tester.pumpWidget(buildOfficerDashboardHarness(screenSize: size));
        await tester.pumpAndSettle();

        // Must not throw any RenderFlex overflow or layout exceptions
        expect(tester.takeException(), isNull);

        // Header elements must be present
        expect(find.textContaining('Vishmitha'), findsOneWidget);
        expect(find.text('Agricultural Officer'), findsOneWidget);
        expect(find.text('Dept. of Agriculture · Regional Extension Division'), findsOneWidget);
        expect(find.byIcon(Icons.notifications_none_rounded), findsOneWidget);

        // Regional banner elements must be present
        expect(find.textContaining('Kurunegala & Matale Zones'), findsOneWidget);
        expect(find.text('Active Surveillance'), findsOneWidget);
        expect(find.text('28°C · RH 78%'), findsOneWidget);
        expect(find.text('Elevated Risk'), findsOneWidget);

        // Metric cards must be present and readable
        expect(find.text('Regional Farms'), findsOneWidget);
        expect(find.text('Field Plantings'), findsOneWidget);
        expect(find.text('Disease Alerts'), findsOneWidget);
        expect(find.text('2 Active'), findsOneWidget);

        // Bottom nav tabs must be present and readable
        expect(find.text('Home'), findsOneWidget);
        expect(find.text('Plant Health'), findsNWidgets(2)); // In tool card badge and bottom nav
        expect(find.text('Crops'), findsOneWidget);
        expect(find.text('Harvest'), findsOneWidget);
        expect(find.text('More'), findsOneWidget);
      });
    }

    testWidgets('renders cleanly with 1.5x increased text scaling on 360px screen', (tester) async {
      const size = Size(360, 800);
      tester.view.physicalSize = size;
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      await tester.pumpWidget(buildOfficerDashboardHarness(
        screenSize: size,
        textScaleFactor: 1.5,
      ));
      await tester.pumpAndSettle();

      // Must not throw any overflow exception under large text scaling
      expect(tester.takeException(), isNull);

      expect(find.textContaining('Vishmitha'), findsOneWidget);
      expect(find.text('Agricultural Officer'), findsOneWidget);
      expect(find.text('Active Surveillance'), findsOneWidget);
      expect(find.text('Regional Farms'), findsOneWidget);
      expect(find.text('Plant Health'), findsNWidgets(2));
    });
  });
}

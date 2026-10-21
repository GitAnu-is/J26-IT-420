import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/auth/auth_state.dart';
import '../../core/models/farm_model.dart';
import '../../core/models/record_model.dart';
import '../../core/widgets/bottom_nav.dart';
import '../../core/widgets/screen_layout.dart';
import '../farms/farm_service.dart';
import '../agricultural_records/record_service.dart';
import 'widgets/farmer_dashboard_view.dart';
import 'widgets/officer_dashboard_view.dart';
import 'widgets/transport_dashboard_view.dart';

class DashboardScreen extends StatefulWidget {
  final FarmService farmService;
  final RecordService recordService;
  final Function(String screen, [Map<String, dynamic>? params]) onNavigate;
  final NavTab activeTab;
  final ValueChanged<NavTab> onTabSelected;

  const DashboardScreen({
    super.key,
    required this.farmService,
    required this.recordService,
    required this.onNavigate,
    required this.activeTab,
    required this.onTabSelected,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<FarmModel> _farms = [];
  List<AgriculturalRecordModel> _records = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final fList = await widget.farmService.getFarms().catchError((_) => <FarmModel>[]);
      final rList = await widget.recordService.getRecords().catchError((_) => <AgriculturalRecordModel>[]);
      if (mounted) {
        setState(() {
          _farms = fList;
          _records = rList;
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = Provider.of<AuthState>(context);
    final user = authState.user;
    final role = authState.role;

    Widget dashboardContent;

    if (role == 'AGRICULTURAL_OFFICER') {
      dashboardContent = OfficerDashboardView(
        user: user,
        farms: _farms,
        records: _records,
        onNavigate: widget.onNavigate,
      );
    } else if (role == 'TRANSPORT_OPERATOR') {
      dashboardContent = TransportDashboardView(
        user: user,
        onNavigate: widget.onNavigate,
      );
    } else {
      dashboardContent = FarmerDashboardView(
        user: user,
        farms: _farms,
        records: _records,
        onNavigate: widget.onNavigate,
      );
    }

    return ScreenLayout(
      bottomNavigationBar: BottomNav(
        activeTab: widget.activeTab,
        onTabSelected: widget.onTabSelected,
        userRole: role,
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: _isLoading && _farms.isEmpty && _records.isEmpty
            ? const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: CircularProgressIndicator(),
                ),
              )
            : dashboardContent,
      ),
    );
  }
}

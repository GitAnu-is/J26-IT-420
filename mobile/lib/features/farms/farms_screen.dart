import 'package:flutter/material.dart';
import '../../core/models/farm_model.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/screen_layout.dart';
import '../../l10n/app_localizations.dart';
import 'farm_service.dart';

class FarmsScreen extends StatefulWidget {
  final FarmService farmService;
  final Function(String screen, [Map<String, dynamic>? params]) onNavigate;

  const FarmsScreen({
    super.key,
    required this.farmService,
    required this.onNavigate,
  });

  @override
  State<FarmsScreen> createState() => _FarmsScreenState();
}

class _FarmsScreenState extends State<FarmsScreen> {
  List<FarmModel> _farms = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchFarms();
  }

  Future<void> _fetchFarms() async {
    setState(() => _isLoading = true);
    try {
      final list = await widget.farmService.getFarms();
      if (mounted) setState(() => _farms = list);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return ScreenLayout(
      showBack: true,
      title: l10n.t('navFarms'),
      subtitle: '${_farms.length} registered land parcels',
      actions: [
        IconButton(
          icon: const Icon(Icons.add_rounded, color: AppColors.brand, size: 28),
          onPressed: () => widget.onNavigate('farm-form'),
        ),
      ],
      body: RefreshIndicator(
        onRefresh: _fetchFarms,
        child: _isLoading && _farms.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : _farms.isEmpty
                ? _buildEmptyState(l10n)
                : Column(
                    children: _farms.map((farm) => _buildFarmCard(farm)).toList(),
                  ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => widget.onNavigate('farm-form'),
        backgroundColor: AppColors.brand,
        icon: const Icon(Icons.add, color: Colors.white),
        label: Text(l10n.t('addFarm'), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }

  Widget _buildEmptyState(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
      alignment: Alignment.center,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: AppColors.brandTint, shape: BoxShape.circle),
            child: const Icon(Icons.map_outlined, color: AppColors.brand, size: 40),
          ),
          const SizedBox(height: 16),
          const Text('No Registered Farms', style: AppTypography.heading2),
          const SizedBox(height: 6),
          const Text(
            'Register your land to receive personalized soil, crop and climate recommendations.',
            style: AppTypography.caption,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          AppButton(
            text: l10n.t('addFarm'),
            width: 200,
            onPressed: () => widget.onNavigate('farm-form'),
          ),
        ],
      ),
    );
  }

  Widget _buildFarmCard(FarmModel farm) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.line),
      ),
      child: InkWell(
        onTap: () => widget.onNavigate('farm-detail', {'farm': farm}),
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      farm.farmName,
                      style: AppTypography.heading2.copyWith(fontSize: 16),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.brandTint,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      farm.district,
                      style: const TextStyle(color: AppColors.brandDark, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.terrain_rounded, size: 14, color: AppColors.muted),
                  const SizedBox(width: 4),
                  Text('Soil: ${farm.soilType.replaceAll('_', ' ')}', style: AppTypography.caption),
                  if (farm.area != null) ...[
                    const SizedBox(width: 12),
                    const Icon(Icons.straighten_rounded, size: 14, color: AppColors.muted),
                    const SizedBox(width: 4),
                    Text('${farm.area} ${farm.areaUnit.toLowerCase()}', style: AppTypography.caption),
                  ],
                ],
              ),
              if (farm.supportedCrops.isNotEmpty) ...[
                const SizedBox(height: 10),
                Wrap(
                  spacing: 6,
                  children: farm.supportedCrops.map((c) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.canvas,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.line),
                    ),
                    child: Text(
                      c.replaceAll('_', ' '),
                      style: const TextStyle(fontSize: 10, color: AppColors.ink, fontWeight: FontWeight.w500),
                    ),
                  )).toList(),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

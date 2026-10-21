import 'package:flutter/material.dart';
import '../../core/models/farm_model.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/screen_layout.dart';
import 'farm_service.dart';

class FarmDetailScreen extends StatelessWidget {
  final FarmModel farm;
  final FarmService farmService;
  final VoidCallback onEdit;
  final VoidCallback onDeleted;
  final Function(String screen, [Map<String, dynamic>? params]) onNavigate;

  const FarmDetailScreen({
    super.key,
    required this.farm,
    required this.farmService,
    required this.onEdit,
    required this.onDeleted,
    required this.onNavigate,
  });

  Future<void> _handleDelete(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Farm'),
        content: Text('Are you sure you want to delete ${farm.farmName}? This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await farmService.deleteFarm(farm.id);
        onDeleted();
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error deleting farm: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ScreenLayout(
      showBack: true,
      title: farm.farmName,
      subtitle: '${farm.district} · ${farm.soilType.replaceAll("_", " ")}',
      actions: [
        IconButton(
          icon: const Icon(Icons.edit_outlined, color: AppColors.ink),
          onPressed: onEdit,
        ),
        IconButton(
          icon: const Icon(Icons.delete_outline, color: AppColors.danger),
          onPressed: () => _handleDelete(context),
        ),
      ],
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Farm Summary Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.line),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Land Parcel Details', style: AppTypography.heading3),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: AppColors.brandTint, borderRadius: BorderRadius.circular(10)),
                      child: Text(farm.district, style: const TextStyle(color: AppColors.brandDark, fontWeight: FontWeight.bold, fontSize: 11)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildRow('Soil Classification', farm.soilType.replaceAll('_', ' ')),
                const Divider(height: 20, color: AppColors.line),
                _buildRow('Registered Area', '${farm.area ?? "N/A"} ${farm.areaUnit.toLowerCase()}'),
                const Divider(height: 20, color: AppColors.line),
                _buildRow('Agro-Ecological Zone', farm.agroEcologicalZone ?? 'Intermediate Zone (IL1)'),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Supported Crops
          const Text('Supported Crops in Parcel', style: AppTypography.heading3),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: farm.supportedCrops.map((c) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.line),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.eco_rounded, color: AppColors.brand, size: 16),
                  const SizedBox(width: 6),
                  Text(c.replaceAll('_', ' '), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
                ],
              ),
            )).toList(),
          ),
          const SizedBox(height: 28),

          // Quick Actions for this farm
          const Text('AI Advisory Actions', style: AppTypography.heading3),
          const SizedBox(height: 12),
          AppButton(
            text: 'Run Crop Recommendation',
            icon: const Icon(Icons.eco_rounded, color: Colors.white, size: 20),
            onPressed: () => onNavigate('crop', {'farmId': farm.id}),
          ),
          const SizedBox(height: 10),
          AppButton(
            text: 'Plan Harvest Timing',
            variant: ButtonVariant.outline,
            icon: const Icon(Icons.calendar_month_rounded, size: 20),
            onPressed: () => onNavigate('harvest', {'farmId': farm.id}),
          ),
        ],
      ),
    );
  }

  Widget _buildRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTypography.caption),
        Text(value, style: AppTypography.heading3.copyWith(fontSize: 13)),
      ],
    );
  }
}

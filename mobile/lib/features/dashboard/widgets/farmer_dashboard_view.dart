import 'package:flutter/material.dart';
import '../../../core/models/farm_model.dart';
import '../../../core/models/record_model.dart';
import '../../../core/models/user_model.dart';
import '../../../core/theme/colors.dart';
import '../../../core/theme/typography.dart';
import '../../../core/widgets/section_heading.dart';
import '../../../l10n/app_localizations.dart';

class FarmerDashboardView extends StatelessWidget {
  final UserModel? user;
  final List<FarmModel> farms;
  final List<AgriculturalRecordModel> records;
  final Function(String screen) onNavigate;

  const FarmerDashboardView({
    super.key,
    required this.user,
    required this.farms,
    required this.records,
    required this.onNavigate,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final primaryFarm = farms.isNotEmpty ? farms.first : null;
    final firstName = user?.fullName.split(' ').first ?? 'Farmer';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // User Header
        Row(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: AppColors.brand,
              child: Text(
                user?.initials ?? 'FM',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.t('greeting', {'name': firstName}),
                    style: AppTypography.heading1.copyWith(fontSize: 20),
                  ),
                  InkWell(
                    onTap: () => onNavigate('farms'),
                    child: Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 14, color: AppColors.brand),
                        const SizedBox(width: 4),
                        Text(
                          primaryFarm != null
                              ? '${primaryFarm.farmName} (${primaryFarm.district})'
                              : 'Register your first farm',
                          style: AppTypography.caption.copyWith(color: AppColors.brand, fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.notifications_none_rounded, color: AppColors.ink),
              onPressed: () => onNavigate('notifications'),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Agricultural Weather & Context Banner
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.brand,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: AppColors.brand.withOpacity(0.2),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Weather Context · ${primaryFarm?.district ?? "Kurunegala"}',
                        style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 12),
                      ),
                      const SizedBox(height: 4),
                      const Row(
                        children: [
                          Icon(Icons.wb_sunny_rounded, color: Colors.white, size: 36),
                          SizedBox(width: 8),
                          Text(
                            '28°C',
                            style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Tropical Agricultural Climate',
                        style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 11, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('Relative Humidity', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 11)),
                      const Text('78%', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 6),
                      Text('Monsoon Rainfall', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 11)),
                      const Text('140 mm', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.only(top: 10),
                decoration: BoxDecoration(
                  border: Border(top: BorderSide(color: Colors.white.withOpacity(0.2))),
                ),
                child: Row(
                  children: [
                    Container(
                      height: 8,
                      width: 8,
                      decoration: const BoxDecoration(color: Color(0xFF4ADE80), shape: BoxShape.circle),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        'AI Services Available: Crop Recommendation · Plant Health · Transportation Risk',
                        style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 10),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Quick Metrics Bar
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                title: 'My Farms',
                value: farms.length.toString(),
                subtitle: 'Registered lands',
                color: AppColors.brand,
                onTap: () => onNavigate('farms'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricCard(
                title: 'Field Records',
                value: records.length.toString(),
                subtitle: 'Active plantings',
                color: AppColors.ink,
                onTap: () => onNavigate('records'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricCard(
                title: 'Plant Health',
                value: 'Active',
                subtitle: 'Grad-CAM ready',
                color: AppColors.brandDark,
                onTap: () => onNavigate('disease'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // AI Services Section
        SectionHeading(title: l10n.t('whatToDo')),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.25,
          children: [
            _buildActionCard(
              title: l10n.t('navCrop'),
              subtitle: 'Random Forest Model',
              icon: Icons.eco_rounded,
              bgColor: const Color(0xFFECFDF5),
              iconColor: const Color(0xFF047857),
              onTap: () => onNavigate('crop'),
            ),
            _buildActionCard(
              title: l10n.t('navHarvest'),
              subtitle: 'Biological Event Window',
              icon: Icons.calendar_month_rounded,
              bgColor: const Color(0xFFFFFBEB),
              iconColor: const Color(0xFFB45309),
              onTap: () => onNavigate('harvest'),
            ),
            _buildActionCard(
              title: l10n.t('navDisease'),
              subtitle: 'Grad-CAM Deep Learning',
              icon: Icons.document_scanner_rounded,
              bgColor: const Color(0xFFFFF1F2),
              iconColor: const Color(0xFFBE123C),
              onTap: () => onNavigate('disease'),
            ),
            _buildActionCard(
              title: l10n.t('filterTransport'),
              subtitle: 'Transit Damage Analysis',
              icon: Icons.local_shipping_rounded,
              bgColor: const Color(0xFFF0F9FF),
              iconColor: const Color(0xFF0369A1),
              onTap: () => onNavigate('transport'),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // Recent Plantings
        if (records.isNotEmpty) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Recent Field Plantings', style: AppTypography.heading3),
              TextButton(
                onPressed: () => onNavigate('records'),
                child: Text(l10n.t('viewAll'), style: const TextStyle(color: AppColors.brand, fontSize: 12)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...records.take(2).map((rec) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.line),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: AppColors.brandTint, borderRadius: BorderRadius.circular(12)),
                  child: const Icon(Icons.eco_rounded, color: AppColors.brand, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(rec.cropType.replaceAll('_', ' '), style: AppTypography.heading3.copyWith(fontSize: 14)),
                      Text(
                        'Planted: ${rec.plantingDate.toIso8601String().split('T').first}',
                        style: AppTypography.caption,
                      ),
                    ],
                  ),
                ),
                if (rec.expectedHarvestDate != null)
                  Text(
                    'Harvest: ${rec.expectedHarvestDate!.toIso8601String().split('T').first}',
                    style: const TextStyle(color: AppColors.brand, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
              ],
            ),
          )),
        ],
      ],
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.line),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: AppTypography.caption, maxLines: 1),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.w900)),
            const SizedBox(height: 2),
            Text(subtitle, style: const TextStyle(color: AppColors.muted, fontSize: 10), maxLines: 1),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color bgColor,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.line),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: iconColor, size: 22),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: AppTypography.heading3.copyWith(fontSize: 13), maxLines: 1),
                Text(subtitle, style: const TextStyle(color: AppColors.muted, fontSize: 10), maxLines: 1),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

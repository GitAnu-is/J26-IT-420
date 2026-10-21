import 'package:flutter/material.dart';
import '../../../core/models/farm_model.dart';
import '../../../core/models/record_model.dart';
import '../../../core/models/user_model.dart';
import '../../../core/theme/colors.dart';
import '../../../core/theme/typography.dart';
import '../../../core/widgets/section_heading.dart';
import '../../../core/widgets/status_badge.dart';
import '../../../l10n/app_localizations.dart';

class OfficerDashboardView extends StatelessWidget {
  final UserModel? user;
  final List<FarmModel> farms;
  final List<AgriculturalRecordModel> records;
  final Function(String screen) onNavigate;

  const OfficerDashboardView({
    super.key,
    required this.user,
    required this.farms,
    required this.records,
    required this.onNavigate,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final officerName = user?.fullName.split(' ').firstWhere(
          (part) => part.toLowerCase() != 'officer',
          orElse: () => user?.name.replaceAll('Officer', '').trim().isNotEmpty == true
              ? user!.name.replaceAll('Officer', '').trim()
              : 'Officer',
        ) ?? 'Officer';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Officer Header
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: AppColors.officerDark,
              child: Text(
                user?.initials ?? 'AO',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    l10n.t('officerGreeting', {'name': officerName}),
                    style: AppTypography.heading1.copyWith(fontSize: 16),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Flexible(
                        child: StatusBadge.role('AGRICULTURAL_OFFICER'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  const Text(
                    'Dept. of Agriculture · Regional Extension Division',
                    style: TextStyle(color: AppColors.muted, fontSize: 11),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
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

        // Regional Surveillance Console Banner
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.officerDark, AppColors.officerTeal, AppColors.transportNavy],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: AppColors.officerDark.withOpacity(0.3),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.location_on_outlined, color: Color(0xFFA7F3D0), size: 14),
                          SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              'Kurunegala & Matale Zones (IL1a/IL1b)',
                              style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.2),
                        border: Border.all(color: const Color(0xFF34D399).withOpacity(0.4)),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'Active Surveillance',
                        style: TextStyle(color: Color(0xFFD1FAE5), fontSize: 10, fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Agro-Climate',
                            style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 10),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            '28°C · RH 78%',
                            style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            'Rainfall: 140mm',
                            style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 9),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Spore Vulnerability',
                            style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 10),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Elevated Risk',
                            style: TextStyle(color: Color(0xFFFDE68A), fontSize: 13, fontWeight: FontWeight.bold),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            'Fungal humidity watch',
                            style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 9),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Officer Metrics Bar
        Row(
          children: [
            Expanded(
              child: _buildOfficerMetric(
                title: 'Regional Farms',
                value: farms.length.toString(),
                subtitle: 'Registered lands',
                color: AppColors.officerDark,
                icon: Icons.map_outlined,
                onTap: () => onNavigate('farms'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildOfficerMetric(
                title: 'Field Plantings',
                value: records.length.toString(),
                subtitle: 'Active crops',
                color: AppColors.ink,
                icon: Icons.assignment_outlined,
                onTap: () => onNavigate('records'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _buildOfficerMetric(
                title: 'Disease Alerts',
                value: '2 Active',
                subtitle: 'Foliar blight',
                color: AppColors.danger,
                icon: Icons.warning_amber_rounded,
                onTap: () => onNavigate('disease'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // Core Officer Advisory Tools
        const SectionHeading(
          title: 'Extension Agronomic & Advisory Tools',
          subtitle: 'Field inspection & verification console',
        ),
        const SizedBox(height: 12),

        // Tool 1: Rapid Leaf Pathology
        _buildOfficerToolCard(
          title: 'Rapid Leaf Pathology Diagnosis',
          description: 'PyTorch CNN deep learning with Grad-CAM heatmap visualization to confirm foliar infections during farm visits.',
          actionText: 'Launch Leaf Disease Scanner',
          badgeText: 'Plant Health',
          badgeBg: const Color(0xFFFEE2E2),
          badgeFg: const Color(0xFF991B1B),
          icon: Icons.document_scanner_rounded,
          iconBg: const Color(0xFFFFF1F2),
          iconColor: const Color(0xFFBE123C),
          onTap: () => onNavigate('disease'),
        ),
        const SizedBox(height: 10),

        // Tool 2: Crop Suitability Advisory
        _buildOfficerToolCard(
          title: 'Soil Nutrient & Cultivar Advisor',
          description: 'Random Forest ML model evaluating soil N-P-K, pH, and precipitation to guide farmers toward optimal crop yield resilience.',
          actionText: 'Run Crop Recommendation Model',
          badgeText: 'Crop Recommendation',
          badgeBg: const Color(0xFFD1FAE5),
          badgeFg: const Color(0xFF065F46),
          icon: Icons.eco_rounded,
          iconBg: const Color(0xFFECFDF5),
          iconColor: const Color(0xFF047857),
          onTap: () => onNavigate('crop'),
        ),
        const SizedBox(height: 10),

        // Tool 3: Harvest Window Planner
        _buildOfficerToolCard(
          title: 'Phenological Harvest Timing Advisor',
          description: 'Growing Degree Days (GDD) and biological window calculator to advise farmers against under-ripe or late post-harvest losses.',
          actionText: 'Evaluate Maturity Window',
          badgeText: 'Harvest Planning',
          badgeBg: const Color(0xFFFEF3C7),
          badgeFg: const Color(0xFF92400E),
          icon: Icons.calendar_month_rounded,
          iconBg: const Color(0xFFFFFBEB),
          iconColor: const Color(0xFFB45309),
          onTap: () => onNavigate('harvest'),
        ),
        const SizedBox(height: 20),

        // Surveillance Notices
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFFFFBEB),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFFDE68A)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.warning_amber_rounded, color: Color(0xFFB45309), size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Solanaceae Early Blight Surveillance',
                      style: TextStyle(color: Color(0xFF92400E), fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'High relative humidity (78%) in Kurunegala intermediate zone increases foliar blight risk. Advise tomato and chilli farmers to ensure field drainage.',
                      style: TextStyle(color: const Color(0xFF92400E).withOpacity(0.9), fontSize: 11, height: 1.4),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildOfficerMetric({
    required String title,
    required String value,
    required String subtitle,
    required Color color,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.line),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: AppTypography.caption.copyWith(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      height: 1.2,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 4),
                Icon(icon, size: 14, color: color.withOpacity(0.85)),
              ],
            ),
            const SizedBox(height: 6),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(
                value,
                style: TextStyle(
                  color: color,
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: const TextStyle(color: AppColors.muted, fontSize: 10),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOfficerToolCard({
    required String title,
    required String description,
    required String actionText,
    required String badgeText,
    required Color badgeBg,
    required Color badgeFg,
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.line),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(12)),
                  child: Icon(icon, color: iconColor, size: 22),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(color: badgeBg, borderRadius: BorderRadius.circular(8)),
                    child: Text(
                      badgeText,
                      style: TextStyle(color: badgeFg, fontSize: 10, fontWeight: FontWeight.bold),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(title, style: AppTypography.heading3.copyWith(fontSize: 15)),
            const SizedBox(height: 4),
            Text(description, style: AppTypography.caption.copyWith(height: 1.4)),
            const SizedBox(height: 12),
            Row(
              children: [
                Flexible(
                  child: Text(
                    actionText,
                    style: TextStyle(color: iconColor, fontSize: 12, fontWeight: FontWeight.bold),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 4),
                Icon(Icons.arrow_forward_rounded, size: 14, color: iconColor),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

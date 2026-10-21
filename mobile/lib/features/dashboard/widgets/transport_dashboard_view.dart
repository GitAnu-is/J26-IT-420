import 'package:flutter/material.dart';
import '../../../core/models/user_model.dart';
import '../../../core/theme/colors.dart';
import '../../../core/theme/typography.dart';
import '../../../core/widgets/section_heading.dart';
import '../../../core/widgets/status_badge.dart';
import '../../../l10n/app_localizations.dart';

class TransportDashboardView extends StatelessWidget {
  final UserModel? user;
  final Function(String screen) onNavigate;

  const TransportDashboardView({
    super.key,
    required this.user,
    required this.onNavigate,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final operatorName = user?.fullName.split(' ').first ?? 'Operator';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Operator Header
        Row(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: AppColors.transportNavy,
              child: Text(
                user?.initials ?? 'TO',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: 6,
                    runSpacing: 4,
                    children: [
                      Text(
                        l10n.t('operatorGreeting', {'name': operatorName}),
                        style: AppTypography.heading1.copyWith(fontSize: 18),
                      ),
                      StatusBadge.role('TRANSPORT_OPERATOR'),
                    ],
                  ),
                  const Text(
                    'Produce Logistics Dispatch · Dambulla / Peliyagoda Dedicated Freight Corridor',
                    style: TextStyle(color: AppColors.muted, fontSize: 11),
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

        // Logistics & Cold-Chain Command Banner
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.transportNavy, Color(0xFF1B3B5F), AppColors.transportDark],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: AppColors.transportNavy.withOpacity(0.3),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                alignment: WrapAlignment.spaceBetween,
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 8,
                runSpacing: 6,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.alt_route_rounded, color: Color(0xFFBAE6FD), size: 14),
                        SizedBox(width: 4),
                        Text(
                          'Dambulla DEC ⇄ Peliyagoda (Colombo)',
                          style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFF38BDF8).withOpacity(0.2),
                      border: Border.all(color: const Color(0xFF7DD3FC).withOpacity(0.4)),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Text(
                      'Transportation Risk Active',
                      style: TextStyle(color: Color(0xFFE0F2FE), fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
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
                          Text('Transit Env', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 10)),
                          const SizedBox(height: 2),
                          const Text('30.5°C · RH 82%', style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                          Text('148 km · Est 3.8h', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 9)),
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
                          Text('Damage Risk', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 10)),
                          const SizedBox(height: 2),
                          const Text('7.4% Avg Loss', style: TextStyle(color: Color(0xFF6EE7B7), fontSize: 13, fontWeight: FontWeight.bold)),
                          Text('Crate cushioned', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 9)),
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

        // Logistics Metrics Bar
        Row(
          children: [
            Expanded(
              child: _buildLogisticsMetric(
                title: 'Risk Evaluator',
                value: 'Active',
                subtitle: 'Pre-dispatch',
                color: AppColors.transportNavy,
                icon: Icons.speed_rounded,
                onTap: () => onNavigate('transport'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildLogisticsMetric(
                title: 'Smart Packaging',
                value: 'DOA / FAO',
                subtitle: 'Crate standards',
                color: AppColors.ink,
                icon: Icons.inventory_2_outlined,
                onTap: () => onNavigate('packaging'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildLogisticsMetric(
                title: 'Fleet Cold Chain',
                value: '13°-14°C',
                subtitle: 'Banana range',
                color: const Color(0xFF047857),
                icon: Icons.ac_unit_rounded,
                onTap: () => onNavigate('history'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // Core Logistics Actions
        const SectionHeading(
          title: 'Logistics Tools & Risk Models',
          subtitle: 'Dispatch risk prediction and packaging guidelines',
        ),
        const SizedBox(height: 12),

        // Action 1: Route Risk Calculator
        _buildLogisticsToolCard(
          title: 'Route Damage Risk Predictor',
          description: 'CatBoost & XGBoost ML models computing damage probabilities based on vehicle type, road condition, duration, temperature, and SHAP factors.',
          actionText: 'Evaluate Dispatch Risk',
          badgeText: 'AI Transit Risk',
          badgeBg: const Color(0xFFE0F2FE),
          badgeFg: const Color(0xFF075985),
          icon: Icons.local_shipping_rounded,
          iconBg: const Color(0xFFF0F9FF),
          iconColor: const Color(0xFF0284C7),
          onTap: () => onNavigate('transport'),
        ),
        const SizedBox(height: 10),

        // Action 2: Smart Packaging
        _buildLogisticsToolCard(
          title: 'DOA / FAO Smart Packaging Engine',
          description: 'Official container, ventilation, stacking height, and cushioning specifications for Banana, Pineapple, and Black Pepper.',
          actionText: 'View Packaging Protocols',
          badgeText: 'DOA / FAO Rules',
          badgeBg: const Color(0xFFFEF3C7),
          badgeFg: const Color(0xFF92400E),
          icon: Icons.inventory_2_rounded,
          iconBg: const Color(0xFFFFFBEB),
          iconColor: const Color(0xFFD97706),
          onTap: () => onNavigate('packaging'),
        ),
        const SizedBox(height: 10),

        // Action 3: History
        _buildLogisticsToolCard(
          title: 'Cargo Transit History & Audit Log',
          description: 'Historical archive of previously evaluated routes, recorded transit times, road vibration conditions, and damage predictions.',
          actionText: 'Review Past Dispatches',
          badgeText: 'Audit Trail',
          badgeBg: const Color(0xFFEDE9FE),
          badgeFg: const Color(0xFF5B21B6),
          icon: Icons.history_rounded,
          iconBg: const Color(0xFFF5F3FF),
          iconColor: const Color(0xFF7C3AED),
          onTap: () => onNavigate('history'),
        ),
        const SizedBox(height: 20),

        // Perishable Cold-Chain Standards
        const Text('Post-Harvest Standards for Supported Perishables', style: AppTypography.heading3),
        const SizedBox(height: 10),
        _buildPerishableCard(
          crop: 'Banana (Ambul, Kolikuttu, Cavendish)',
          temp: '13°C – 14°C (Never below 12°C)',
          packaging: 'Rigid plastic crates (max 4-high stack), leaf/foam cushioning, top ventilation.',
          color: const Color(0xFFF59E0B),
        ),
        const SizedBox(height: 8),
        _buildPerishableCard(
          crop: 'Pineapple (Mauritius, Kew)',
          temp: '7°C – 10°C | RH 85-90%',
          packaging: 'Ventilated telescopic cartons, upright crown orientation, avoid compression.',
          color: const Color(0xFF10B981),
        ),
        const SizedBox(height: 8),
        _buildPerishableCard(
          crop: 'Black Pepper',
          temp: 'Ambient Dry (< 28°C) | Moisture < 12%',
          packaging: 'Double-lined moisture-barrier woven bags, palletized 15cm floor separation.',
          color: const Color(0xFF6B7280),
        ),
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildLogisticsMetric({
    required String title,
    required String value,
    required String subtitle,
    required Color color,
    required IconData icon,
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    title,
                    style: AppTypography.caption,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Icon(icon, size: 14, color: color.withOpacity(0.8)),
              ],
            ),
            const SizedBox(height: 4),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(value, style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.w900)),
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

  Widget _buildLogisticsToolCard({
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
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: badgeBg, borderRadius: BorderRadius.circular(8)),
                  child: Text(badgeText, style: TextStyle(color: badgeFg, fontSize: 10, fontWeight: FontWeight.bold)),
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
                Text(actionText, style: TextStyle(color: iconColor, fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(width: 4),
                Icon(Icons.arrow_forward_rounded, size: 14, color: iconColor),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPerishableCard({
    required String crop,
    required String temp,
    required String packaging,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(crop, style: AppTypography.heading3.copyWith(fontSize: 13)),
              Text(temp, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 4),
          Text(packaging, style: AppTypography.caption),
        ],
      ),
    );
  }
}

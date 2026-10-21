import 'package:flutter/material.dart';
import '../theme/colors.dart';
import '../theme/typography.dart';

class StatusBadge extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color textColor;
  final IconData? icon;

  const StatusBadge({
    super.key,
    required this.label,
    required this.backgroundColor,
    required this.textColor,
    this.icon,
  });

  factory StatusBadge.risk(String level) {
    final l = level.toUpperCase();
    if (l == 'LOW') {
      return const StatusBadge(
        label: 'Low Risk',
        backgroundColor: AppColors.brandTint,
        textColor: AppColors.brandDark,
        icon: Icons.check_circle_outline,
      );
    } else if (l == 'HIGH') {
      return const StatusBadge(
        label: 'High Risk',
        backgroundColor: AppColors.dangerTint,
        textColor: AppColors.dangerInk,
        icon: Icons.warning_amber_rounded,
      );
    }
    return const StatusBadge(
      label: 'Medium Risk',
      backgroundColor: AppColors.warnTint,
      textColor: AppColors.warnInk,
      icon: Icons.info_outline,
    );
  }

  factory StatusBadge.role(String role) {
    final r = role.toUpperCase();
    if (r.contains('OFFICER')) {
      return const StatusBadge(
        label: 'Agricultural Officer',
        backgroundColor: Color(0xFFE0F2F1),
        textColor: Color(0xFF004D40),
        icon: Icons.verified_user_outlined,
      );
    } else if (r.contains('TRANSPORT')) {
      return const StatusBadge(
        label: 'Transport Operator',
        backgroundColor: Color(0xFFE3F2FD),
        textColor: Color(0xFF0D47A1),
        icon: Icons.local_shipping_outlined,
      );
    }
    return const StatusBadge(
      label: 'Farmer',
      backgroundColor: AppColors.brandTint,
      textColor: AppColors.brandDark,
      icon: Icons.eco_outlined,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: textColor),
            const SizedBox(width: 4),
          ],
          Flexible(
            child: Text(
              label,
              style: AppTypography.captionBold.copyWith(color: textColor, fontSize: 11),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

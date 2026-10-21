import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/colors.dart';
import '../../core/widgets/screen_layout.dart';
import '../../core/auth/auth_state.dart';
import '../../core/constants/app_constants.dart';
import '../../l10n/app_localizations.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final authState = Provider.of<AuthState>(context);
    final user = authState.user;

    final initial = user != null && user.name.isNotEmpty ? user.name[0].toUpperCase() : 'A';
    final roleDisplay = user != null
        ? user.role == AppConstants.roleOfficer
            ? l10n.roleOfficer
            : user.role == AppConstants.roleTransport
                ? l10n.roleTransport
                : l10n.roleFarmer
        : l10n.roleFarmer;

    return ScreenLayout(
      showBack: false,
      title: l10n.moreTitle,
      subtitle: 'Account settings, research references, and platform tools',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // User Card
          InkWell(
            onTap: () => Navigator.pushNamed(context, '/settings'),
            borderRadius: BorderRadius.circular(24),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.line),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.02),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: const BoxDecoration(
                      color: AppColors.brand,
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      initial,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?.name ?? 'AgriGuard Member',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppColors.ink,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '$roleDisplay · Sri Lanka',
                          style: const TextStyle(fontSize: 12, color: AppColors.muted),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right, color: AppColors.muted),
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Quick Action Banner
          InkWell(
            onTap: () => Navigator.pushNamed(context, '/transport/new'),
            borderRadius: BorderRadius.circular(24),
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: AppColors.info,
                borderRadius: BorderRadius.circular(24),
                gradient: const LinearGradient(
                  colors: [Color(0xFF0284C7), Color(0xFF0369A1)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.18),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.local_shipping, color: Colors.white, size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.fTransportTitle,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          l10n.fTransportOfficial,
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.85),
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right, color: Colors.white70),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Menu items list
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.line),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                _buildMenuItem(
                  icon: Icons.document_scanner_outlined,
                  label: l10n.checkMyPlant,
                  badge: 'AI',
                  onTap: () => Navigator.pushNamed(context, '/disease/new'),
                ),
                const Divider(height: 1, color: AppColors.line),
                _buildMenuItem(
                  icon: Icons.history,
                  label: l10n.historyTitle,
                  onTap: () => Navigator.pushNamed(context, '/history'),
                ),
                const Divider(height: 1, color: AppColors.line),
                _buildMenuItem(
                  icon: Icons.notifications_none,
                  label: l10n.notifTitle,
                  badge: '4',
                  onTap: () => Navigator.pushNamed(context, '/notifications'),
                ),
                const Divider(height: 1, color: AppColors.line),
                _buildMenuItem(
                  icon: Icons.all_inbox_outlined,
                  label: l10n.packagingTitle,
                  onTap: () => Navigator.pushNamed(context, '/packaging'),
                ),
                const Divider(height: 1, color: AppColors.line),
                _buildMenuItem(
                  icon: Icons.settings_outlined,
                  label: l10n.settingsTitle,
                  onTap: () => Navigator.pushNamed(context, '/settings'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Logout Row
          InkWell(
            onTap: () async {
              await authState.logout();
              if (context.mounted) {
                Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
              }
            },
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.line),
              ),
              child: Row(
                children: [
                  const Icon(Icons.logout, color: AppColors.danger, size: 22),
                  const SizedBox(width: 14),
                  Text(
                    l10n.logout,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: AppColors.danger,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          Center(
            child: Text(
              l10n.appVersion,
              style: const TextStyle(fontSize: 11, color: AppColors.muted),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String label,
    String? badge,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Row(
          children: [
            Icon(icon, color: AppColors.brand, size: 22),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppColors.ink,
                ),
              ),
            ),
            if (badge != null) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.danger,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  badge,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 8),
            ],
            const Icon(Icons.chevron_right, color: AppColors.muted, size: 18),
          ],
        ),
      ),
    );
  }
}

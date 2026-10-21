import 'package:flutter/material.dart';
import '../../theme/colors.dart';
import '../../core/widgets/screen_layout.dart';
import '../../core/widgets/app_button.dart';
import '../../l10n/app_localizations.dart';

class NotificationItem {
  final String id;
  final String title;
  final String body;
  final String timeAgo;
  final String severity; // urgent, warning, info
  final IconData icon;
  final String route;
  bool isRead;

  NotificationItem({
    required this.id,
    required this.title,
    required this.body,
    required this.timeAgo,
    required this.severity,
    required this.icon,
    required this.route,
    this.isRead = false,
  });
}

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _showPermissionBanner = true;

  final List<NotificationItem> _notifications = [
    NotificationItem(
      id: '1',
      title: 'Monsoon Heavy Rainfall Alert',
      body: 'Kurunegala district expected to receive 85mm rainfall over the next 48 hours. Ensure crop drainage.',
      timeAgo: '2h ago',
      severity: 'urgent',
      icon: Icons.thunderstorm_outlined,
      route: '/crop/new',
    ),
    NotificationItem(
      id: '2',
      title: 'Optimal Harvest Window Reached',
      body: 'Banana Block A has reached 120 days post-planting. Verify fruit circumference and finger angles.',
      timeAgo: '5h ago',
      severity: 'warning',
      icon: Icons.event_available_outlined,
      route: '/harvest/new',
    ),
    NotificationItem(
      id: '3',
      title: 'Foliar Pathology Detected Nearby',
      body: 'Agricultural officers reported early Black Sigatoka incidence in surrounding divisions.',
      timeAgo: '1d ago',
      severity: 'warning',
      icon: Icons.coronavirus_outlined,
      route: '/disease/new',
    ),
    NotificationItem(
      id: '4',
      title: 'Transit Route Roadwork Advisory',
      body: 'A1 Highway Kurunegala to Colombo road resurfacing in progress. Expect elevated vibration risk.',
      timeAgo: '2d ago',
      severity: 'info',
      icon: Icons.local_shipping_outlined,
      route: '/transport/new',
    ),
  ];

  void _markAllRead() {
    setState(() {
      for (final n in _notifications) {
        n.isRead = true;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return ScreenLayout(
      showBack: true,
      title: l10n.notifTitle,
      subtitle: 'Real-time agro-meteorological advisories and harvest alerts',
      action: TextButton(
        onPressed: _markAllRead,
        child: Text(
          l10n.markAllRead,
          style: const TextStyle(
            color: AppColors.brand,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Push Permission Card
          if (_showPermissionBanner) ...[
            Container(
              padding: const EdgeInsets.all(18),
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.brandTint,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: const Icon(Icons.notifications_active, color: AppColors.brand, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              l10n.allowTitle,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: AppColors.ink,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              l10n.allowBody,
                              style: const TextStyle(fontSize: 11, color: AppColors.muted),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: AppButton(
                          label: l10n.notNow,
                          variant: AppButtonVariant.secondary,
                          onPressed: () => setState(() => _showPermissionBanner = false),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: AppButton(
                          label: l10n.allow,
                          variant: AppButtonVariant.primary,
                          onPressed: () => setState(() => _showPermissionBanner = false),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Notification List
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _notifications.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final n = _notifications[index];
              final Color pillBg;
              final Color pillText;
              final Color iconBg;
              final Color iconColor;
              final String sevLabel;

              if (n.severity == 'urgent') {
                pillBg = AppColors.danger;
                pillText = Colors.white;
                iconBg = AppColors.dangerTint;
                iconColor = AppColors.danger;
                sevLabel = l10n.sevUrgent;
              } else if (n.severity == 'warning') {
                pillBg = AppColors.warn;
                pillText = AppColors.ink;
                iconBg = AppColors.warnTint;
                iconColor = AppColors.warnInk;
                sevLabel = l10n.sevWarning;
              } else {
                pillBg = AppColors.infoTint;
                pillText = AppColors.info;
                iconBg = AppColors.infoTint;
                iconColor = AppColors.info;
                sevLabel = l10n.sevInfo;
              }

              return InkWell(
                onTap: () {
                  setState(() => n.isRead = true);
                  Navigator.pushNamed(context, n.route);
                },
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.line),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.02),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: iconBg,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Icon(n.icon, color: iconColor, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: pillBg,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    sevLabel,
                                    style: TextStyle(
                                      color: pillText,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  n.timeAgo,
                                  style: const TextStyle(fontSize: 11, color: AppColors.muted),
                                ),
                                if (!n.isRead) ...[
                                  const Spacer(),
                                  Container(
                                    width: 8,
                                    height: 8,
                                    decoration: const BoxDecoration(
                                      color: AppColors.brand,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              n.title,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: n.isRead ? FontWeight.w600 : FontWeight.bold,
                                color: AppColors.ink,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              n.body,
                              style: const TextStyle(fontSize: 12, height: 1.35, color: AppColors.muted),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Text(
                                  l10n.seeDetails,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.brand,
                                  ),
                                ),
                                const SizedBox(width: 2),
                                const Icon(Icons.chevron_right, size: 14, color: AppColors.brand),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../theme/colors.dart';
import '../../l10n/app_localizations.dart';

enum NavTab { home, crop, disease, harvest, transport, packaging, history, more }

class BottomNav extends StatelessWidget {
  final NavTab activeTab;
  final ValueChanged<NavTab> onTabSelected;
  final String userRole;

  const BottomNav({
    super.key,
    required this.activeTab,
    required this.onTabSelected,
    this.userRole = 'FARMER',
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final normRole = userRole.toUpperCase();

    List<_NavItemData> items;

    if (normRole.contains('TRANSPORT')) {
      items = [
        _NavItemData(tab: NavTab.home, icon: Icons.home_rounded, label: l10n.t('navHome')),
        _NavItemData(tab: NavTab.transport, icon: Icons.local_shipping_rounded, label: l10n.t('transitRisk')),
        _NavItemData(tab: NavTab.packaging, icon: Icons.inventory_2_rounded, label: l10n.t('navPackaging')),
        _NavItemData(tab: NavTab.history, icon: Icons.history_rounded, label: l10n.t('historyTitle')),
        _NavItemData(tab: NavTab.more, icon: Icons.grid_view_rounded, label: l10n.t('navMore')),
      ];
    } else if (normRole.contains('OFFICER')) {
      items = [
        _NavItemData(tab: NavTab.home, icon: Icons.home_rounded, label: l10n.t('navHome')),
        _NavItemData(tab: NavTab.disease, icon: Icons.document_scanner_rounded, label: l10n.t('navDisease')),
        _NavItemData(tab: NavTab.crop, icon: Icons.eco_rounded, label: l10n.t('navCrop')),
        _NavItemData(tab: NavTab.harvest, icon: Icons.event_available_rounded, label: l10n.t('navHarvest')),
        _NavItemData(tab: NavTab.more, icon: Icons.grid_view_rounded, label: l10n.t('navMore')),
      ];
    } else {
      // Default FARMER
      items = [
        _NavItemData(tab: NavTab.home, icon: Icons.home_rounded, label: l10n.t('navHome')),
        _NavItemData(tab: NavTab.crop, icon: Icons.eco_rounded, label: l10n.t('navCrop')),
        _NavItemData(tab: NavTab.disease, icon: Icons.document_scanner_rounded, label: l10n.t('navDisease')),
        _NavItemData(tab: NavTab.harvest, icon: Icons.event_available_rounded, label: l10n.t('navHarvest')),
        _NavItemData(tab: NavTab.more, icon: Icons.grid_view_rounded, label: l10n.t('navMore')),
      ];
    }

    return SafeArea(
      top: false,
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppColors.line, width: 1)),
        ),
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: items.map((item) {
            final isSelected = item.tab == activeTab;
            return Expanded(
              child: InkWell(
                onTap: () => onTabSelected(item.tab),
                borderRadius: BorderRadius.circular(16),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        height: 30,
                        width: 48,
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.brandTint : Colors.transparent,
                          borderRadius: BorderRadius.circular(15),
                        ),
                        child: Icon(
                          item.icon,
                          color: isSelected ? AppColors.brand : AppColors.muted,
                          size: 21,
                        ),
                      ),
                      const SizedBox(height: 2),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          item.label,
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                            color: isSelected ? AppColors.brand : AppColors.muted,
                          ),
                          maxLines: 1,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _NavItemData {
  final NavTab tab;
  final IconData icon;
  final String label;

  _NavItemData({required this.tab, required this.icon, required this.label});
}

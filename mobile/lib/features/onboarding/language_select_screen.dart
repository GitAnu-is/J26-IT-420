import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/screen_layout.dart';
import '../../l10n/app_localizations.dart';

class LanguageSelectScreen extends StatefulWidget {
  final Locale currentLocale;
  final ValueChanged<Locale> onLocaleChanged;
  final VoidCallback onContinue;

  const LanguageSelectScreen({
    super.key,
    required this.currentLocale,
    required this.onLocaleChanged,
    required this.onContinue,
  });

  @override
  State<LanguageSelectScreen> createState() => _LanguageSelectScreenState();
}

class _LanguageSelectScreenState extends State<LanguageSelectScreen> {
  late String _selectedCode;

  final List<Map<String, String>> _languages = [
    {'code': 'en', 'name': 'English', 'native': 'English'},
    {'code': 'si', 'name': 'Sinhala', 'native': 'සිංහල'},
    {'code': 'ta', 'name': 'Tamil', 'native': 'தமிழ்'},
  ];

  @override
  void initState() {
    super.initState();
    _selectedCode = widget.currentLocale.languageCode;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return ScreenLayout(
      showBack: true,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 12),
          Text(l10n.t('chooseLanguage'), style: AppTypography.heading1),
          const SizedBox(height: 8),
          Text(
            'Select your preferred language for the AgriGuard application.',
            style: AppTypography.caption,
          ),
          const SizedBox(height: 24),
          Column(
            children: _languages.map((lang) {
              final isSelected = lang['code'] == _selectedCode;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: InkWell(
                  onTap: () {
                    setState(() => _selectedCode = lang['code']!);
                    widget.onLocaleChanged(Locale(lang['code']!));
                  },
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.brandSoft : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isSelected ? AppColors.brand : AppColors.line,
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              lang['native']!,
                              style: AppTypography.heading2.copyWith(fontSize: 16),
                            ),
                            Text(
                              lang['name']!,
                              style: AppTypography.caption,
                            ),
                          ],
                        ),
                        if (isSelected)
                          const Icon(Icons.check_circle_rounded, color: AppColors.brand, size: 24)
                        else
                          const Icon(Icons.radio_button_unchecked, color: AppColors.line, size: 24),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
          AppButton(
            text: l10n.t('continueBtn'),
            onPressed: widget.onContinue,
          ),
        ],
      ),
    );
  }
}

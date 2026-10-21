import 'package:flutter/material.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/logo.dart';
import '../../core/widgets/app_button.dart';
import '../../l10n/app_localizations.dart';

class SplashScreen extends StatelessWidget {
  final VoidCallback onGetStarted;

  const SplashScreen({super.key, required this.onGetStarted});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      backgroundColor: AppColors.brand,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            children: [
              const Spacer(),
              // Animated Brand Logo Container
              Container(
                height: 100,
                width: 100,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(28),
                ),
                alignment: Alignment.center,
                child: const AgriGuardLogo(size: 64, inverted: true),
              ),
              const SizedBox(height: 24),
              Text(
                'Agri Guard',
                style: AppTypography.display.copyWith(
                  color: Colors.white,
                  fontSize: 34,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                l10n.t('tagline'),
                style: AppTypography.heading3.copyWith(
                  color: Colors.white.withOpacity(0.95),
                  fontSize: 16,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  l10n.t('splashIntro'),
                  style: AppTypography.body.copyWith(
                    color: Colors.white.withOpacity(0.85),
                    fontSize: 13,
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              const Spacer(),
              AppButton(
                text: l10n.t('getStarted'),
                variant: ButtonVariant.inverse,
                onPressed: onGetStarted,
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}

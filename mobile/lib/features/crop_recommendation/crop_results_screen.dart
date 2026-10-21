import 'package:flutter/material.dart';
import '../../theme/colors.dart';
import '../../core/widgets/screen_layout.dart';
import '../../core/widgets/app_button.dart';
import '../../core/models/crop_model.dart';
import '../../l10n/app_localizations.dart';

class CropResultsScreen extends StatefulWidget {
  final RecommendCropResult? result;
  final String? crop;

  const CropResultsScreen({
    super.key,
    this.result,
    this.crop,
  });

  @override
  State<CropResultsScreen> createState() => _CropResultsScreenState();
}

class _CropResultsScreenState extends State<CropResultsScreen> {
  bool _guideOpen = false;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final recCrop = widget.result?.recommendedCrop ?? widget.crop ?? 'BANANA';
    final cropDisplay = recCrop.replaceAll('_', ' ');
    final confidencePct = ((widget.result?.confidence ?? 0.88) * 100).round();
    final probs = widget.result?.probabilities ?? {'BANANA': 0.88, 'PINEAPPLE': 0.08, 'BLACK_PEPPER': 0.04};

    return ScreenLayout(
      showBack: true,
      title: l10n.cropResultsTitle,
      subtitle: '${l10n.officialName}: ${l10n.fCropOfficial}',
      action: AppButton(
        label: 'Plan Harvest',
        icon: Icons.calendar_month,
        variant: AppButtonVariant.primary,
        onPressed: () {
          Navigator.pushNamed(
            context,
            '/harvest/new',
            arguments: {'crop': recCrop},
          );
        },
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Validation / Research Banner
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.warnTint,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.warn.withOpacity(0.4)),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.warning_amber_rounded, color: AppColors.warnInk, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Live Model Output — RESEARCH PROTOTYPE',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppColors.warnInk,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Predictions reflect Random Forest classifier trained on Sri Lankan agro-ecological dataset. Always cross-reference with local Department of Agriculture extension advice.',
                        style: TextStyle(fontSize: 11, color: AppColors.ink),
                      ),
                      if (widget.result?.model != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Model: ${widget.result!.model}',
                          style: const TextStyle(fontSize: 10, color: AppColors.muted),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Main Result Card
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.line),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Crop Banner
                Container(
                  height: 140,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppColors.brandDark,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                    gradient: const LinearGradient(
                      colors: [AppColors.brandDark, AppColors.brand],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Stack(
                    children: [
                      Positioned(
                        right: -10,
                        bottom: -15,
                        child: Icon(
                          Icons.eco,
                          size: 160,
                          color: Colors.white.withOpacity(0.08),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text(
                                'Recommended Crop',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            Text(
                              cropDisplay,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Expanded(
                            child: Text(
                              'Predicted best fit for input soil and agro-ecological conditions',
                              style: TextStyle(fontSize: 12, color: AppColors.muted),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '$confidencePct%',
                                style: const TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.brand,
                                ),
                              ),
                              const Text(
                                'Model Match',
                                style: TextStyle(fontSize: 11, color: AppColors.muted),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Probabilities Breakdown
                      if (probs.isNotEmpty) ...[
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppColors.canvas,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'CLASS PROBABILITIES (RANDOM FOREST)',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.8,
                                  color: AppColors.ink,
                                ),
                              ),
                              const SizedBox(height: 12),
                              ...probs.entries.map((entry) {
                                final isTop = entry.key == recCrop;
                                final pVal = (entry.value * 100).round();

                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            entry.key.replaceAll('_', ' '),
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: isTop ? FontWeight.bold : FontWeight.w500,
                                              color: isTop ? AppColors.brandDark : AppColors.ink,
                                            ),
                                          ),
                                          Text(
                                            '$pVal%',
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: isTop ? FontWeight.bold : FontWeight.w500,
                                              color: isTop ? AppColors.brandDark : AppColors.muted,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(4),
                                        child: LinearProgressIndicator(
                                          value: entry.value.clamp(0.0, 1.0),
                                          backgroundColor: AppColors.line,
                                          valueColor: AlwaysStoppedAnimation<Color>(
                                            isTop ? AppColors.brand : AppColors.muted.withOpacity(0.4),
                                          ),
                                          minHeight: 6,
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                      ],

                      // Plan Harvest button
                      AppButton(
                        label: 'Plan Harvest for $cropDisplay',
                        icon: Icons.calendar_today,
                        variant: AppButtonVariant.primary,
                        onPressed: () {
                          Navigator.pushNamed(
                            context,
                            '/harvest/new',
                            arguments: {'crop': recCrop},
                          );
                        },
                      ),
                      const SizedBox(height: 10),

                      // Guide Toggle
                      AppButton(
                        label: _guideOpen ? l10n.hideGuide : l10n.viewGuide,
                        icon: Icons.menu_book,
                        variant: AppButtonVariant.secondary,
                        onPressed: () => setState(() => _guideOpen = !_guideOpen),
                      ),

                      if (_guideOpen) ...[
                        const SizedBox(height: 16),
                        const Divider(height: 1, color: AppColors.line),
                        const SizedBox(height: 14),
                        _buildGuideItem('Ensure soil drainage aligns with the seasonal monsoon cycle.'),
                        const SizedBox(height: 8),
                        _buildGuideItem('Apply organic mulch to maintain steady soil moisture above 70%.'),
                        const SizedBox(height: 8),
                        _buildGuideItem('Verify fertilizer application follows the Department of Agriculture (DOA) crop guidelines.'),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildGuideItem(String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.check_circle, size: 16, color: AppColors.brand),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontSize: 12, color: AppColors.ink),
          ),
        ),
      ],
    );
  }
}

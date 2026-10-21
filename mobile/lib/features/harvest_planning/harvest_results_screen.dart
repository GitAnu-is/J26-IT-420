import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../theme/colors.dart';
import '../../core/widgets/screen_layout.dart';
import '../../core/widgets/app_button.dart';
import '../../core/models/crop_model.dart';
import '../../l10n/app_localizations.dart';

class HarvestResultsScreen extends StatelessWidget {
  final PredictHarvestResult? result;
  final String? crop;
  final DateTime? referenceDate;

  const HarvestResultsScreen({
    super.key,
    this.result,
    this.crop,
    this.referenceDate,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final dateFormat = DateFormat('MMM d, yyyy');

    final cropName = result?.cropType ?? crop ?? 'BANANA';
    final cropDisplay = cropName.replaceAll('_', ' ');
    final durationDays = result?.predictedDurationDays ?? 120;
    final expectedDateStr = result?.expectedHarvestDate ?? '';
    final expectedDate = DateTime.tryParse(expectedDateStr) ??
        (referenceDate != null ? referenceDate!.add(Duration(days: durationDays)) : DateTime.now().add(Duration(days: durationDays)));
    final windowStart = DateTime.tryParse(result?.harvestWindowStart ?? '') ?? expectedDate.subtract(const Duration(days: 7));
    final windowEnd = DateTime.tryParse(result?.harvestWindowEnd ?? '') ?? expectedDate.add(const Duration(days: 7));
    final windowDays = result?.windowDays ?? 14;

    return ScreenLayout(
      showBack: true,
      title: l10n.fHarvestTitle,
      subtitle: '${l10n.officialName}: ${l10n.fHarvestOfficial}',
      action: AppButton(
        label: l10n.historyTitle,
        icon: Icons.history,
        variant: AppButtonVariant.secondary,
        onPressed: () {
          Navigator.pushNamed(context, '/history', arguments: {'filter': 'harvest'});
        },
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Validation / Disclosure Banner
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.warnTint,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.warn.withOpacity(0.4)),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.warning_amber_rounded, color: AppColors.warnInk, size: 20),
                SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Harvest Prediction Model — RESEARCH ESTIMATE',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppColors.warnInk,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Harvest window bounds reflect model RMSE standard error and must not be interpreted as statistically calibrated confidence intervals.',
                        style: TextStyle(fontSize: 11, color: AppColors.ink),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Main Card
          Container(
            padding: const EdgeInsets.all(20),
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.brandTint,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        cropDisplay,
                        style: const TextStyle(
                          color: AppColors.brandDark,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Row(
                      children: [
                        Text(
                          '$durationDays',
                          style: const TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.bold,
                            color: AppColors.brand,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Days', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.ink)),
                            Text('duration', style: TextStyle(fontSize: 10, color: AppColors.muted)),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                Text(
                  'Target: ${dateFormat.format(expectedDate)}',
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Predicted harvest maturity from biological reference event',
                  style: TextStyle(fontSize: 12, color: AppColors.muted),
                ),
                const SizedBox(height: 18),

                // Reference Event Detail
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.canvas,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.event_note, size: 18, color: AppColors.brand),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          cropName == 'BLACK_PEPPER'
                              ? 'Reference: Spike Emergence / Flowering'
                              : 'Reference: Field Planting Date',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.ink),
                        ),
                      ),
                      if (referenceDate != null)
                        Text(
                          dateFormat.format(referenceDate!),
                          style: const TextStyle(fontSize: 11, color: AppColors.muted),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // Harvest Window Range
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.canvas,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.line),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'RECOMMENDED HARVEST WINDOW',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.8,
                              color: AppColors.ink,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppColors.line),
                            ),
                            child: Text(
                              '±${(windowDays / 2).round()} Days Window',
                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.brandDark),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Earliest Harvest', style: TextStyle(fontSize: 11, color: AppColors.muted)),
                                const SizedBox(height: 2),
                                Text(
                                  dateFormat.format(windowStart),
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.ink),
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.arrow_forward, size: 16, color: AppColors.muted),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                const Text('Latest Harvest', style: TextStyle(fontSize: 11, color: AppColors.muted)),
                                const SizedBox(height: 2),
                                Text(
                                  dateFormat.format(windowEnd),
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.ink),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                AppButton(
                  label: 'Log in Agricultural Records',
                  icon: Icons.assignment_turned_in_outlined,
                  variant: AppButtonVariant.primary,
                  onPressed: () {
                    Navigator.pushNamed(
                      context,
                      '/records/new',
                      arguments: {
                        'crop': cropName,
                        'plantingDate': referenceDate,
                        'expectedHarvest': expectedDate,
                      },
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

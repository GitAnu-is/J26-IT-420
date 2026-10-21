import 'package:flutter/material.dart';
import '../../theme/colors.dart';
import '../../core/widgets/screen_layout.dart';
import '../../core/widgets/app_button.dart';
import '../../core/models/transportation_model.dart';
import '../../l10n/app_localizations.dart';

class TransportResultsScreen extends StatelessWidget {
  final TransportationRiskResult? result;
  final String? crop;
  final PredictTransportationRiskInput? input;

  const TransportResultsScreen({
    super.key,
    this.result,
    this.crop,
    this.input,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final res = result;
    final cropType = res?.cropType ?? crop ?? 'BANANA';
    final riskLevel = (res?.riskLevel ?? 'MEDIUM').toUpperCase();
    final damageProb = res?.damageProbability ?? 0.32;
    final damagePct = (damageProb * 100).round();

    final Color riskColor;
    final Color riskBg;
    if (riskLevel == 'HIGH') {
      riskColor = AppColors.danger;
      riskBg = AppColors.dangerTint;
    } else if (riskLevel == 'MEDIUM') {
      riskColor = AppColors.warnInk;
      riskBg = AppColors.warnTint;
    } else {
      riskColor = AppColors.brandDark;
      riskBg = AppColors.brandTint;
    }

    final contributors = res?.topContributors ?? [
      ShapContribution(
        featureName: 'road_condition',
        shapValue: 0.18,
        description: 'Rough surface causes mechanical vibration and internal bruising.',
      ),
      ShapContribution(
        featureName: 'temperature_celsius',
        shapValue: 0.12,
        description: 'Ambient 29°C accelerates ethylene release and respiration.',
      ),
      ShapContribution(
        featureName: 'packaging_type',
        shapValue: -0.15,
        description: 'Rigid plastic crates mitigate compressive crush load.',
      ),
    ];

    final packagingRecs = res?.packagingRecommendations ?? [
      'Use rigid, stackable plastic crates with rounded interior edges.',
      'Line bottom and sidewalls with dry plantain leaves or foam padding.',
      'Limit crate stacking to 4 layers maximum to prevent lower carton compression.',
    ];

    final handlingGuidance = res?.handlingAdvice ?? [
      'Avoid dropping crates during manual truck loading and unloading.',
      'Secure cargo using tension straps to eliminate transit load shift.',
      'Transport during early dawn (4:00 AM - 8:00 AM) to minimize ambient thermal stress.',
    ];

    return ScreenLayout(
      showBack: true,
      title: l10n.fTransportTitle,
      subtitle: '${l10n.officialName}: ${l10n.fTransportOfficial}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Research Provenance & Scientific Disclaimer Banner
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
                        'Transportation Risk Model (CatBoost Regression)',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppColors.warnInk,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Transportation damage risk prediction powered by trained tree ensemble classifier with TreeExplainer SHAP attribution.',
                        style: TextStyle(fontSize: 11, color: AppColors.ink),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Notice: SHAP feature attributions describe statistical model attribution, not necessarily physical causality.',
                        style: TextStyle(fontSize: 10, fontStyle: FontStyle.italic, color: AppColors.muted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Main Risk Summary Card
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
                        cropType.replaceAll('_', ' '),
                        style: const TextStyle(
                          color: AppColors.brandDark,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: riskBg,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '$riskLevel RISK',
                        style: TextStyle(
                          color: riskColor,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Radial / Semi-circular Gauge Visualizer
                SizedBox(
                  height: 110,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox(
                        height: 100,
                        width: 100,
                        child: CircularProgressIndicator(
                          value: damageProb.clamp(0.0, 1.0),
                          strokeWidth: 10,
                          backgroundColor: AppColors.line,
                          valueColor: AlwaysStoppedAnimation<Color>(riskColor),
                        ),
                      ),
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            '$damagePct%',
                            style: TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.bold,
                              color: riskColor,
                            ),
                          ),
                          const Text(
                            'Damage Risk',
                            style: TextStyle(fontSize: 10, color: AppColors.muted),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Predicted transit post-harvest loss probability: $damagePct%',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.ink),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // SHAP Feature Importance Explanations
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.line),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.insights, size: 18, color: AppColors.brand),
                    SizedBox(width: 8),
                    Text(
                      'SHAP FEATURE ATTRIBUTIONS',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                        color: AppColors.ink,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                const Text(
                  'Identifies which transport and environmental factors most strongly shifted the prediction.',
                  style: TextStyle(fontSize: 11, color: AppColors.muted),
                ),
                const SizedBox(height: 14),

                ...contributors.map((c) {
                  final increases = c.shapValue >= 0;
                  final featName = c.featureName.replaceAll('_', ' ').toUpperCase();

                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.canvas,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.line),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              featName,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: AppColors.ink,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: increases ? AppColors.dangerTint : AppColors.brandTint,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                increases ? '↑ Increases Risk' : '↓ Lowers Risk',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: increases ? AppColors.dangerInk : AppColors.brandDark,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (c.description.isNotEmpty) ...[
                          const SizedBox(height: 6),
                          Text(
                            c.description,
                            style: const TextStyle(fontSize: 12, color: AppColors.muted),
                          ),
                        ],
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Packaging & Cargo Mitigation Recommendations
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.line),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.inventory_2_outlined, size: 18, color: AppColors.brand),
                    SizedBox(width: 8),
                    Text(
                      'PACKAGING & LOGISTICS MITIGATIONS',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                        color: AppColors.ink,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ...packagingRecs.map((rec) => _buildGuidanceRow(rec)),
                const SizedBox(height: 12),
                const Divider(height: 1, color: AppColors.line),
                const SizedBox(height: 12),
                const Row(
                  children: [
                    Icon(Icons.handshake_outlined, size: 18, color: AppColors.brand),
                    SizedBox(width: 8),
                    Text(
                      'HANDLING & TRANSIT GUIDANCE',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                        color: AppColors.ink,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ...handlingGuidance.map((rec) => _buildGuidanceRow(rec)),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Action Buttons
          AppButton(
            label: 'Explore Smart Packaging Advice',
            icon: Icons.all_inbox_outlined,
            variant: AppButtonVariant.primary,
            onPressed: () {
              Navigator.pushNamed(
                context,
                '/packaging',
                arguments: {'crop': cropType},
              );
            },
          ),
          const SizedBox(height: 10),
          AppButton(
            label: l10n.previousChecks,
            icon: Icons.history,
            variant: AppButtonVariant.secondary,
            onPressed: () {
              Navigator.pushNamed(context, '/history', arguments: {'filter': 'transport'});
            },
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildGuidanceRow(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 2),
            child: Icon(Icons.check_circle_outline, size: 15, color: AppColors.brand),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 12, height: 1.35, color: AppColors.ink),
            ),
          ),
        ],
      ),
    );
  }
}

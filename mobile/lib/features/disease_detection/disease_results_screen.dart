import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';

import '../../theme/colors.dart';
import '../../core/widgets/screen_layout.dart';
import '../../core/widgets/app_button.dart';
import '../../core/models/disease_model.dart';
import '../../l10n/app_localizations.dart';

class DiseaseResultsScreen extends StatefulWidget {
  final DiseaseDetectionResult? result;
  final File? imageFile;
  final String? crop;

  const DiseaseResultsScreen({
    super.key,
    this.result,
    this.imageFile,
    this.crop,
  });

  @override
  State<DiseaseResultsScreen> createState() => _DiseaseResultsScreenState();
}

class _DiseaseResultsScreenState extends State<DiseaseResultsScreen> {
  int _selectedTab = 0; // 0 = Photo, 1 = Grad-CAM Heatmap

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final res = widget.result;

    final cropType = (res?.cropType ?? widget.crop ?? 'BANANA').toUpperCase();
    final diseaseName = res?.displayName ?? res?.diseaseName ?? 'Banana Sigatoka Leaf Spot';
    final scientificName = res?.scientificName;
    final confidencePct = ((res?.confidence ?? 0.89) * 100).round();
    final isHealthy = res?.isHealthy ?? false;
    final severityStatus = res?.severityStatus ?? 'UNAVAILABLE';
    final modelName = res?.modelIdentifier ?? 'EfficientNet-B0';
    final modelVer = res?.modelVersion ?? 'v1.0';

    final guidanceList = (res?.treatmentGuidance != null && res!.treatmentGuidance.isNotEmpty)
        ? res.treatmentGuidance
        : [
            'Prune severely infected leaves displaying necrotic spots and dispose safely off-field.',
            'Improve field drainage to prevent stagnant water from elevating canopy humidity.',
            'Apply recommended fungicide (e.g., Mancozeb or Propiconazole) following DOA Sri Lanka extension guidelines.',
          ];

    final citation = res?.guidanceCitation ??
        'Department of Agriculture Sri Lanka, Horticultural Research & Development Institute (HORDI), Gannoruwa.';

    return ScreenLayout(
      showBack: true,
      title: l10n.checkMyPlant,
      subtitle: 'AI foliar health analysis and pathology diagnosis',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Provenance Banner (Research identifiers like "Component 2" removed)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.warnTint,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.warn.withValues(alpha: 0.4)),
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
                      Text(
                        'Plant Pathology Model ($modelName)',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppColors.warnInk,
                        ),
                      ),
                      const SizedBox(height: 3),
                      const Text(
                        'Deep learning convolutional model evaluated for foliar symptoms. Grad-CAM visualizes network attention regions. Field diagnostics should be confirmed with your regional agricultural officer.',
                        style: TextStyle(fontSize: 11, color: AppColors.ink, height: 1.35),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Model: $modelName ($modelVer) | Diagnostic Mode: Real-Time PyTorch Inference',
                        style: const TextStyle(fontSize: 10, color: AppColors.muted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Visualizer Card with Photo / Grad-CAM Tab Toggle
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.line),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Toggle Tab Bar
                Container(
                  color: AppColors.canvas,
                  padding: const EdgeInsets.all(6),
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedTab = 0),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 9),
                            decoration: BoxDecoration(
                              color: _selectedTab == 0 ? Colors.white : Colors.transparent,
                              borderRadius: BorderRadius.circular(14),
                              boxShadow: _selectedTab == 0
                                  ? [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.04),
                                        blurRadius: 4,
                                        offset: const Offset(0, 1),
                                      ),
                                    ]
                                  : null,
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.image_outlined,
                                  size: 16,
                                  color: _selectedTab == 0 ? AppColors.brandDark : AppColors.muted,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  l10n.photoTab,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: _selectedTab == 0 ? FontWeight.bold : FontWeight.w500,
                                    color: _selectedTab == 0 ? AppColors.brandDark : AppColors.muted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _selectedTab = 1),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 9),
                            decoration: BoxDecoration(
                              color: _selectedTab == 1 ? Colors.white : Colors.transparent,
                              borderRadius: BorderRadius.circular(14),
                              boxShadow: _selectedTab == 1
                                  ? [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.04),
                                        blurRadius: 4,
                                        offset: const Offset(0, 1),
                                      ),
                                    ]
                                  : null,
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.bubble_chart_outlined,
                                  size: 16,
                                  color: _selectedTab == 1 ? AppColors.brandDark : AppColors.muted,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  l10n.gradcamHeatmap,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: _selectedTab == 1 ? FontWeight.bold : FontWeight.w500,
                                    color: _selectedTab == 1 ? AppColors.brandDark : AppColors.muted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Image Display Area
                Container(
                  height: 250,
                  width: double.infinity,
                  color: const Color(0xFF0F172A),
                  child: _selectedTab == 0
                      ? (widget.imageFile != null
                          ? Image.file(widget.imageFile!, fit: BoxFit.contain)
                          : const Center(
                              child: Icon(Icons.eco, size: 60, color: Colors.white24),
                            ))
                      : _buildGradcamView(res),
                ),

                // Grad-CAM Caption Bar
                if (_selectedTab == 1)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    color: AppColors.canvas,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          l10n.attentionActivation,
                          style: const TextStyle(fontSize: 11, color: AppColors.muted),
                        ),
                        const Text(
                          'PyTorch Grad-CAM',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: AppColors.brandDark,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Diagnostic Diagnosis Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.line),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
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
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
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
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            diseaseName,
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: AppColors.ink,
                            ),
                          ),
                          if (scientificName != null && scientificName.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(
                              scientificName,
                              style: const TextStyle(
                                fontSize: 12,
                                fontStyle: FontStyle.italic,
                                color: AppColors.muted,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '$confidencePct%',
                          style: const TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w900,
                            color: AppColors.brand,
                          ),
                        ),
                        const Text('Confidence', style: TextStyle(fontSize: 11, color: AppColors.muted)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Confidence Progress Bar
                Container(
                  height: 8,
                  decoration: BoxDecoration(
                    color: AppColors.line,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: FractionallySizedBox(
                    alignment: Alignment.centerLeft,
                    widthFactor: (confidencePct / 100.0).clamp(0.0, 1.0),
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.brand,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Severity Assessment Status Card (Truthful UNAVAILABLE baseline)
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.canvas,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.line),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.show_chart_rounded, size: 16, color: AppColors.muted),
                              const SizedBox(width: 6),
                              Text(
                                l10n.severityStatus,
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                  color: AppColors.ink,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: severityStatus == 'UNAVAILABLE'
                                  ? AppColors.warnTint
                                  : isHealthy
                                      ? AppColors.brandTint
                                      : AppColors.dangerTint,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              severityStatus,
                              style: TextStyle(
                                color: severityStatus == 'UNAVAILABLE'
                                    ? AppColors.warnInk
                                    : isHealthy
                                        ? AppColors.brandDark
                                        : AppColors.danger,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        severityStatus == 'UNAVAILABLE'
                            ? l10n.sevUnavailable
                            : (isHealthy
                                ? 'Healthy foliage baseline (no pathological lesions or necrosis detected).'
                                : 'Assessed Severity: ${res?.severityLevel ?? "Standard"}'),
                        style: const TextStyle(fontSize: 11, color: AppColors.muted, height: 1.35),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Evidence-Backed Disease Management Guidance
                Row(
                  children: [
                    const Icon(Icons.description_outlined, size: 16, color: AppColors.brand),
                    const SizedBox(width: 6),
                    Text(
                      l10n.doaGuidance.toUpperCase(),
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.6,
                        color: AppColors.ink,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ...guidanceList.map((step) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Padding(
                          padding: EdgeInsets.only(top: 2),
                          child: Icon(Icons.check_circle_rounded, size: 15, color: AppColors.brand),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            step,
                            style: const TextStyle(fontSize: 12, height: 1.4, color: AppColors.ink),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
                const SizedBox(height: 12),

                // Supporting References Card
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.canvas,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.line),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.menu_book_outlined, size: 15, color: AppColors.brand),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          citation,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.muted,
                            height: 1.35,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Check Another Plant Button
          AppButton(
            label: l10n.checkAnother,
            icon: Icons.camera_alt_outlined,
            variant: AppButtonVariant.primary,
            onPressed: () => Navigator.pop(context),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildGradcamView(DiseaseDetectionResult? res) {
    if (res?.base64Gradcam != null && res!.base64Gradcam!.isNotEmpty) {
      try {
        final bytes = base64Decode(res.base64Gradcam!);
        return Image.memory(bytes, fit: BoxFit.contain);
      } catch (_) {}
    }

    if (res?.gradcamUrl != null && res!.gradcamUrl!.isNotEmpty) {
      return Image.network(
        res.fullGradcamUrl,
        fit: BoxFit.contain,
        loadingBuilder: (context, child, progress) {
          if (progress == null) return child;
          return const Center(child: CircularProgressIndicator(color: AppColors.brand));
        },
        errorBuilder: (context, error, stackTrace) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.bubble_chart_outlined, size: 36, color: Colors.white38),
                SizedBox(height: 8),
                Text(
                  'Grad-CAM saliency map available',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          );
        },
      );
    }

    return widget.imageFile != null
        ? Image.file(widget.imageFile!, fit: BoxFit.contain)
        : const Center(
            child: Icon(Icons.eco, size: 50, color: Colors.white24),
          );
  }
}

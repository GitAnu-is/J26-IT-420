import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';

import '../../theme/colors.dart';
import '../../core/widgets/screen_layout.dart';
import '../../core/widgets/app_button.dart';
import '../../core/api/api_client.dart';
import '../../core/constants/app_constants.dart';
import '../../l10n/app_localizations.dart';
import '../../app/routes.dart';
import 'disease_service.dart';

class DiseaseCaptureScreen extends StatefulWidget {
  final String? initialCrop;

  const DiseaseCaptureScreen({super.key, this.initialCrop});

  @override
  State<DiseaseCaptureScreen> createState() => _DiseaseCaptureScreenState();
}

class _DiseaseCaptureScreenState extends State<DiseaseCaptureScreen> {
  final ImagePicker _picker = ImagePicker();
  File? _imageFile;
  bool _isAnalyzing = false;
  String? _errorMessage;
  bool _triedSubmit = false;

  String _crop = AppConstants.cropBanana;

  late final ApiClient _apiClient;
  late final DiseaseService _diseaseService;

  @override
  void initState() {
    super.initState();
    _apiClient = Provider.of<ApiClient>(context, listen: false);
    _diseaseService = DiseaseService(_apiClient);
    if (widget.initialCrop != null && widget.initialCrop!.isNotEmpty) {
      _crop = widget.initialCrop!.toUpperCase();
    }
    _retrieveLostData();
  }

  Future<void> _retrieveLostData() async {
    try {
      final response = await _picker.retrieveLostData();
      if (response.isEmpty) return;
      if (response.file != null && mounted) {
        _validateAndSetImage(File(response.file!.path));
      } else if (response.exception != null && mounted) {
        setState(() {
          _errorMessage = 'Camera capture interrupted: ${response.exception!.message}';
        });
      }
    } catch (_) {}
  }

  bool _validateAndSetImage(File file) {
    if (!file.existsSync()) {
      setState(() => _errorMessage = 'Selected image file not found.');
      return false;
    }

    final bytes = file.lengthSync();
    if (bytes > 8 * 1024 * 1024) {
      setState(() => _errorMessage = 'File size exceeds maximum limit of 8 MB');
      return false;
    }

    final ext = file.path.split('.').last.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp'].contains(ext)) {
      setState(() => _errorMessage = 'Unsupported format. Please select JPEG, PNG, or WebP.');
      return false;
    }

    setState(() {
      _imageFile = file;
      _errorMessage = null;
    });
    return true;
  }

  Future<void> _pickImage(ImageSource source) async {
    setState(() => _errorMessage = null);
    try {
      final picked = await _picker.pickImage(
        source: source,
        maxWidth: 1600,
        maxHeight: 1600,
        imageQuality: 88,
      );
      if (picked != null && mounted) {
        _validateAndSetImage(File(picked.path));
      }
    } catch (e) {
      if (mounted) {
        final err = e.toString().toLowerCase();
        if (err.contains('camera_access_denied') || err.contains('permission')) {
          setState(() => _errorMessage = 'Camera permission denied. Please allow camera access in device settings.');
        } else {
          setState(() => _errorMessage = 'Could not access image: ${e.toString().replaceAll('Exception: ', '')}');
        }
      }
    }
  }

  Future<void> _useSamplePhoto() async {
    setState(() {
      _errorMessage = null;
      _crop = AppConstants.cropBanana;
    });
    try {
      final byteData = await rootBundle.load('assets/images/banana_leaf_sample.jpg');
      final tempDir = await getTemporaryDirectory();
      final sampleFile = File('${tempDir.path}/banana_leaf_sample.jpg');
      await sampleFile.writeAsBytes(
        byteData.buffer.asUint8List(byteData.offsetInBytes, byteData.lengthInBytes),
        flush: true,
      );
      if (mounted) {
        _validateAndSetImage(sampleFile);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _errorMessage = 'Could not load sample leaf fixture: $e');
      }
    }
  }

  Future<void> _submitAnalysis() async {
    setState(() => _triedSubmit = true);

    if (_imageFile == null) {
      setState(() => _errorMessage = 'Please take a photo or select an image from gallery');
      return;
    }

    setState(() {
      _isAnalyzing = true;
      _errorMessage = null;
    });

    try {
      final result = await _diseaseService.detectDisease(
        imageFile: _imageFile!,
        cropType: _crop,
      );

      if (mounted) {
        Navigator.pushNamed(
          context,
          AppRoutes.diseaseResults,
          arguments: {
            'result': result,
            'imageFile': _imageFile,
            'crop': _crop,
          },
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isAnalyzing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    final cropOptions = [
      {'val': AppConstants.cropBanana, 'label': 'Banana (කෙසෙල්)', 'icon': Icons.eco},
      {'val': AppConstants.cropPineapple, 'label': 'Pineapple (අන්නාසි)', 'icon': Icons.grass},
      {'val': AppConstants.cropBlackPepper, 'label': 'Black Pepper (ගම්මිරිස්)', 'icon': Icons.park},
    ];

    return ScreenLayout(
      showBack: true,
      title: l10n.checkMyPlant,
      subtitle: 'AI foliar health analysis and pathology diagnosis',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Validation / Error Banner
          if (_errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.dangerTint,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.error_outline_rounded, color: AppColors.danger, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(
                        color: AppColors.dangerInk,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Crop Selector Section
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.selectCrop,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 10),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                child: Row(
                  children: cropOptions.map((opt) {
                    final isSelected = _crop == opt['val'];
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: InkWell(
                        onTap: () => setState(() => _crop = opt['val'] as String),
                        borderRadius: BorderRadius.circular(20),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: isSelected ? AppColors.brandTint : Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: isSelected ? AppColors.brand : AppColors.line,
                              width: isSelected ? 1.8 : 1.0,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.02),
                                blurRadius: 4,
                                offset: const Offset(0, 1),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              Icon(
                                opt['icon'] as IconData,
                                size: 16,
                                color: isSelected ? AppColors.brandDark : AppColors.muted,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                opt['label'] as String,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                  color: isSelected ? AppColors.brandDark : AppColors.ink,
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
            ],
          ),
          const SizedBox(height: 20),

          // Leaf Photo Upload Area
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.addPhoto,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 10),
              if (_imageFile != null)
                // Selected Image Preview
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: AppColors.line),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 10,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Stack(
                    children: [
                      AspectRatio(
                        aspectRatio: 1.0,
                        child: Image.file(
                          _imageFile!,
                          fit: BoxFit.cover,
                          width: double.infinity,
                        ),
                      ),
                      // Top-left: Leaf photo attached badge
                      Positioned(
                        top: 12,
                        left: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.92),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.check_circle_rounded,
                                color: AppColors.brand,
                                size: 16,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                l10n.leafAttached,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.brandDark,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      // Bottom-right: Retake button
                      Positioned(
                        bottom: 12,
                        right: 12,
                        child: InkWell(
                          onTap: () => setState(() => _imageFile = null),
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: const Color(0xDD0F172A),
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.2),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.refresh_rounded, color: Colors.white, size: 15),
                                const SizedBox(width: 6),
                                Text(
                                  l10n.retake,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              else
                // Empty Image Upload Box matching React Web UI
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: (_triedSubmit && _imageFile == null)
                          ? AppColors.danger.withValues(alpha: 0.6)
                          : AppColors.brand.withValues(alpha: 0.35),
                      width: 1.8,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.02),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      // Camera Circular Badge
                      Container(
                        height: 64,
                        width: 64,
                        decoration: const BoxDecoration(
                          color: AppColors.brandTint,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.camera_alt_outlined,
                          size: 32,
                          color: AppColors.brand,
                        ),
                      ),
                      const SizedBox(height: 20),
                      // Action buttons: Take photo & Choose from gallery
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              icon: const Icon(Icons.camera_alt, size: 16),
                              label: Text(l10n.takePhoto),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.brand,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                              onPressed: () => _pickImage(ImageSource.camera),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: OutlinedButton.icon(
                              icon: const Icon(Icons.photo_library_outlined, size: 16, color: AppColors.ink),
                              label: Text(
                                l10n.fromGallery,
                                style: const TextStyle(color: AppColors.ink),
                              ),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: AppColors.line),
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                              onPressed: () => _pickImage(ImageSource.gallery),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      const Text(
                        'Supports JPEG, PNG, and WebP (up to 8 MB)',
                        style: TextStyle(fontSize: 12, color: AppColors.muted),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: _useSamplePhoto,
                        style: TextButton.styleFrom(
                          foregroundColor: AppColors.brand,
                          visualDensity: VisualDensity.compact,
                        ),
                        child: Text(
                          '${l10n.useSample} (Banana Leaf Fixture)',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 20),

          // Photo-Taking Tips Section matching React Web UI
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.line),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.02),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.photoTips.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.8,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 12),
                _buildTipRow(Icons.wb_sunny_outlined, l10n.tip1),
                const SizedBox(height: 10),
                _buildTipRow(Icons.filter_center_focus_outlined, l10n.tip2),
                const SizedBox(height: 10),
                _buildTipRow(Icons.water_drop_outlined, l10n.tip3),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Submit Button
          AppButton(
            label: _isAnalyzing ? l10n.analyzingLeaf : l10n.checkPlant,
            icon: Icons.biotech_outlined,
            variant: AppButtonVariant.primary,
            isLoading: _isAnalyzing,
            onPressed: (_imageFile == null || _isAnalyzing) ? null : _submitAnalysis,
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildTipRow(IconData icon, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: AppColors.brand),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 12,
              height: 1.4,
              color: AppColors.ink,
            ),
          ),
        ),
      ],
    );
  }
}

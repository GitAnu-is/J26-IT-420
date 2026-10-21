import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/colors.dart';
import '../../core/widgets/screen_layout.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_text_field.dart';
import '../../core/widgets/choice_chips.dart';
import '../../core/api/api_client.dart';
import '../../core/models/transportation_model.dart';
import '../../core/constants/app_constants.dart';
import '../../l10n/app_localizations.dart';
import '../transportation_risk/transport_service.dart';

class SmartPackagingScreen extends StatefulWidget {
  final String? initialCrop;

  const SmartPackagingScreen({super.key, this.initialCrop});

  @override
  State<SmartPackagingScreen> createState() => _SmartPackagingScreenState();
}

class _SmartPackagingScreenState extends State<SmartPackagingScreen> {
  String _crop = AppConstants.cropBanana;
  final _distanceController = TextEditingController(text: '120');
  String _vehicleType = 'COVERED_TRUCK';

  bool _isLoading = false;
  String? _errorMessage;
  SmartPackagingResult? _result;

  late final ApiClient _apiClient;
  late final TransportService _transportService;

  @override
  void initState() {
    super.initState();
    _apiClient = Provider.of<ApiClient>(context, listen: false);
    _transportService = TransportService(_apiClient);
    if (widget.initialCrop != null) {
      _crop = widget.initialCrop!;
    }
    _fetchRecommendations();
  }

  @override
  void dispose() {
    _distanceController.dispose();
    super.dispose();
  }

  Future<void> _fetchRecommendations() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final res = await _transportService.recommendPackaging(
        cropType: _crop,
        vehicleType: _vehicleType,
        distanceKm: double.tryParse(_distanceController.text.trim()) ?? 120.0,
      );

      if (mounted) {
        setState(() {
          _result = res;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return ScreenLayout(
      showBack: true,
      title: l10n.packagingTitle,
      subtitle: 'Source-backed post-harvest packaging, storage, and handling standards',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.dangerTint,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.danger.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: AppColors.danger, size: 20),
                  const SizedBox(width: 8),
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

          // Crop selector
          ChoiceChips<String>(
            label: l10n.cropType,
            options: [
              ChipOption(value: AppConstants.cropBanana, label: l10n.cropBanana),
              ChipOption(value: AppConstants.cropPineapple, label: l10n.cropPineapple),
              ChipOption(value: AppConstants.cropBlackPepper, label: l10n.cropBlackPepper),
            ],
            selected: _crop,
            onSelected: (val) {
              setState(() => _crop = val);
              _fetchRecommendations();
            },
          ),
          const SizedBox(height: 16),

          // Parameter Tweaks Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.line),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'CARGO PARAMETERS',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.8,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: AppTextField(
                        label: 'Transit Distance (km)',
                        hint: '120',
                        keyboardType: TextInputType.number,
                        controller: _distanceController,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Vehicle Type',
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.ink),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                            decoration: BoxDecoration(
                              color: AppColors.canvas,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppColors.line),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                value: _vehicleType,
                                isExpanded: true,
                                items: const [
                                  DropdownMenuItem(value: 'COVERED_TRUCK', child: Text('Covered Truck', style: TextStyle(fontSize: 12))),
                                  DropdownMenuItem(value: 'OPEN_CANOPY_TRUCK', child: Text('Open Canopy', style: TextStyle(fontSize: 12))),
                                  DropdownMenuItem(value: 'REFRIGERATED_TRUCK', child: Text('Reefer Cold', style: TextStyle(fontSize: 12))),
                                ],
                                onChanged: (val) {
                                  if (val != null) setState(() => _vehicleType = val);
                                },
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                AppButton(
                  label: 'Update Recommendations',
                  icon: Icons.refresh,
                  variant: AppButtonVariant.secondary,
                  isLoading: _isLoading,
                  onPressed: _fetchRecommendations,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Output Cards
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 36),
              child: Center(child: CircularProgressIndicator(color: AppColors.brand)),
            )
          else if (_result != null) ...[
            // Packaging Specs Card
            Container(
              padding: const EdgeInsets.all(20),
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
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.brandTint,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.all_inbox_outlined, color: AppColors.brandDark, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'RECOMMENDED PRIMARY CONTAINER',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.8,
                                color: AppColors.muted,
                              ),
                            ),
                            Text(
                              _result!.recommendedPackaging,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.ink,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  const Divider(height: 1, color: AppColors.line),
                  const SizedBox(height: 16),

                  _buildSpecRow(Icons.layers_outlined, 'Cushioning & Lining', _result!.cushioning),
                  const SizedBox(height: 12),
                  _buildSpecRow(Icons.air_outlined, 'Ventilation Specification', _result!.ventilation),
                  const SizedBox(height: 12),
                  _buildSpecRow(Icons.vertical_align_top_outlined, 'Stacking Limit', _result!.stacking),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Precautions Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.line),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'TRANSPORT & CARGO PRECAUTIONS',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...(_result!.precautions.isNotEmpty
                          ? _result!.precautions
                          : [
                              'Pre-cool produce to 14°C before transit loading to remove field heat.',
                              'Use corner protection brackets under ratchet tie-downs to prevent top tier box crushing.',
                              'Ensure bottom layer crates rest on pallets rather than directly on the metal floor.',
                            ])
                      .map((p) => Padding(
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
                                    p,
                                    style: const TextStyle(fontSize: 12, height: 1.35, color: AppColors.ink),
                                  ),
                                ),
                              ],
                            ),
                          )),
                ],
              ),
            ),
          ],
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSpecRow(IconData icon, String title, String val) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: AppColors.brand),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 11, color: AppColors.muted)),
              const SizedBox(height: 1),
              Text(val, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.ink)),
            ],
          ),
        ),
      ],
    );
  }
}

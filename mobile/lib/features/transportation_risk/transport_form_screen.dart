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
import 'transport_service.dart';

class TransportFormScreen extends StatefulWidget {
  final String? initialCrop;

  const TransportFormScreen({super.key, this.initialCrop});

  @override
  State<TransportFormScreen> createState() => _TransportFormScreenState();
}

class _TransportFormScreenState extends State<TransportFormScreen> {
  final _formKey = GlobalKey<FormState>();
  int _currentStep = 0;
  bool _isSubmitting = false;
  String? _errorMessage;

  String _crop = AppConstants.cropBanana;

  String _originDistrict = 'Kurunegala';
  String _destinationDistrict = 'Colombo';
  final _distanceController = TextEditingController(text: '110');
  final _durationController = TextEditingController(text: '3.5');

  String _vehicleType = 'COVERED_TRUCK';
  String _roadCondition = 'CARPETED_HIGHWAY';
  String _packagingType = 'PLASTIC_CRATES';

  final _tempController = TextEditingController(text: '29');
  final _humidityController = TextEditingController(text: '75');
  String _weatherCondition = 'CLEAR';
  String _storageCondition = 'AMBIENT';

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
  }

  @override
  void dispose() {
    _distanceController.dispose();
    _durationController.dispose();
    _tempController.dispose();
    _humidityController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final input = PredictTransportationRiskInput(
        crop: _crop,
        distanceKm: double.tryParse(_distanceController.text.trim()) ?? 110.0,
        durationHours: double.tryParse(_durationController.text.trim()) ?? 3.5,
        vehicleType: _vehicleType,
        packagingType: _packagingType,
        roadCondition: _roadCondition,
        temperatureCelsius: double.tryParse(_tempController.text.trim()) ?? 29.0,
        humidityPercentage: double.tryParse(_humidityController.text.trim()) ?? 75.0,
        weatherCondition: _weatherCondition,
        storageCondition: _storageCondition,
        originDistrict: _originDistrict,
        destinationDistrict: _destinationDistrict,
      );

      final result = await _transportService.predictRisk(input);

      if (mounted) {
        Navigator.pushNamed(
          context,
          '/transport/results',
          arguments: {
            'result': result,
            'crop': _crop,
            'input': input,
          },
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return ScreenLayout(
      showBack: true,
      title: l10n.fTransportTitle,
      subtitle: '${l10n.officialName}: ${l10n.fTransportOfficial}',
      child: Form(
        key: _formKey,
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

            // Step Indicator Tabs
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: AppColors.canvas,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.line),
              ),
              child: Row(
                children: [
                  _buildTab(0, '1. Route & Crop'),
                  _buildTab(1, '2. Vehicle & Packs'),
                  _buildTab(2, '3. Ambient Climate'),
                ],
              ),
            ),
            const SizedBox(height: 20),

            if (_currentStep == 0) _buildStep1(l10n),
            if (_currentStep == 1) _buildStep2(l10n),
            if (_currentStep == 2) _buildStep3(l10n),

            const SizedBox(height: 28),

            Row(
              children: [
                if (_currentStep > 0) ...[
                  Expanded(
                    child: AppButton(
                      label: l10n.back,
                      variant: AppButtonVariant.secondary,
                      onPressed: () => setState(() => _currentStep--),
                    ),
                  ),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  flex: 2,
                  child: AppButton(
                    label: _currentStep == 2 ? 'Evaluate Damage Risk' : l10n.next,
                    icon: _currentStep == 2 ? Icons.local_shipping_outlined : null,
                    variant: AppButtonVariant.primary,
                    isLoading: _isSubmitting,
                    onPressed: () {
                      if (_currentStep < 2) {
                        setState(() => _currentStep++);
                      } else {
                        _submit();
                      }
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildTab(int stepIndex, String title) {
    final isSel = _currentStep == stepIndex;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _currentStep = stepIndex),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSel ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            boxShadow: isSel
                ? [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ]
                : null,
          ),
          child: Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
              color: isSel ? AppColors.brandDark : AppColors.muted,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStep1(AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Crop Chips
        ChoiceChips<String>(
          label: l10n.cropType,
          options: [
            ChipOption(value: AppConstants.cropBanana, label: l10n.cropBanana),
            ChipOption(value: AppConstants.cropPineapple, label: l10n.cropPineapple),
            ChipOption(value: AppConstants.cropBlackPepper, label: l10n.cropBlackPepper),
          ],
          selected: _crop,
          onSelected: (val) => setState(() => _crop = val),
        ),
        const SizedBox(height: 16),

        // Route Districts Card
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
                'LOGISTICS ROUTE',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 12),
              // Origin District
              const Text('Origin District', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.ink)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: AppColors.canvas,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.line),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: AppConstants.districts.contains(_originDistrict) ? _originDistrict : AppConstants.districts.first,
                    isExpanded: true,
                    items: AppConstants.districts.map((d) {
                      return DropdownMenuItem<String>(value: d, child: Text(d, style: const TextStyle(fontSize: 13, color: AppColors.ink)));
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _originDistrict = val);
                    },
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Destination District
              const Text('Destination District / Wholesale Hub', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.ink)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: AppColors.canvas,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.line),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: AppConstants.districts.contains(_destinationDistrict) ? _destinationDistrict : 'Colombo',
                    isExpanded: true,
                    items: AppConstants.districts.map((d) {
                      return DropdownMenuItem<String>(value: d, child: Text(d, style: const TextStyle(fontSize: 13, color: AppColors.ink)));
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _destinationDistrict = val);
                    },
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Distance and Duration
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: 'Transit Distance (km)',
                      hint: '110',
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      controller: _distanceController,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppTextField(
                      label: 'Transit Duration (hrs)',
                      hint: '3.5',
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      controller: _durationController,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStep2(AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Vehicle Type
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
                'VEHICLE & PACKAGING SPECS',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 14),

              const Text('Transport Vehicle Type', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.ink)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
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
                      DropdownMenuItem(value: 'OPEN_CANOPY_TRUCK', child: Text('Open Canopy Truck', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'COVERED_TRUCK', child: Text('Covered Truck', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'REFRIGERATED_TRUCK', child: Text('Refrigerated Truck (Cold Chain)', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'PICKUP', child: Text('Pickup Truck', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'THREE_WHEELER', child: Text('Three-Wheeler', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'TRACTOR_TRAILER', child: Text('Tractor Trailer', style: TextStyle(fontSize: 13))),
                    ],
                    onChanged: (val) {
                      if (val != null) setState(() => _vehicleType = val);
                    },
                  ),
                ),
              ),
              const SizedBox(height: 14),

              const Text('Packaging Container', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.ink)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: AppColors.canvas,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.line),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _packagingType,
                    isExpanded: true,
                    items: const [
                      DropdownMenuItem(value: 'PLASTIC_CRATES', child: Text('Rigid Plastic Crates (Standard)', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'WOODEN_CRATES', child: Text('Wooden Crates', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'CORRUGATED_BOXES', child: Text('Corrugated Fiberboard Cartons', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'GUNNY_BAGS', child: Text('Gunny / Poly Sacks', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'JUTE_BAGS', child: Text('Jute Bags', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'POLYETHYLENE_LINED_BAGS', child: Text('Poly-Lined Bags', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'LOOSE_BULK', child: Text('Loose Bulk Stacking (High Risk)', style: TextStyle(fontSize: 13))),
                    ],
                    onChanged: (val) {
                      if (val != null) setState(() => _packagingType = val);
                    },
                  ),
                ),
              ),
              const SizedBox(height: 14),

              const Text('Road Surface Condition', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.ink)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: AppColors.canvas,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.line),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _roadCondition,
                    isExpanded: true,
                    items: const [
                      DropdownMenuItem(value: 'CARPETED_HIGHWAY', child: Text('Carpeted Highway / Expressway', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'PAVED_GOOD', child: Text('Paved Asphalt (Good)', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'PAVED_POOR', child: Text('Paved (Potholes / Rough)', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'UNPAVED_GRAVEL', child: Text('Unpaved / Gravel Feeder Road', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'MIXED', child: Text('Mixed Highway & Rural Feeder', style: TextStyle(fontSize: 13))),
                    ],
                    onChanged: (val) {
                      if (val != null) setState(() => _roadCondition = val);
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStep3(AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
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
                'ENVIRONMENTAL & STORAGE CONDITIONS',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: 'Transit Temp (°C)',
                      hint: '29',
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      controller: _tempController,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppTextField(
                      label: 'Relative Humidity (%)',
                      hint: '75',
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      controller: _humidityController,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Weather Condition
              const Text('Weather Condition', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.ink)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: AppColors.canvas,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.line),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _weatherCondition,
                    isExpanded: true,
                    items: const [
                      DropdownMenuItem(value: 'CLEAR', child: Text('Clear / Moderate Sun', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'HOT_SUNNY', child: Text('Hot / Intense Solar Radiation', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'OVERCAST', child: Text('Overcast / Humid', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'RAIN', child: Text('Rain / High Moisture Exposure', style: TextStyle(fontSize: 13))),
                    ],
                    onChanged: (val) {
                      if (val != null) setState(() => _weatherCondition = val);
                    },
                  ),
                ),
              ),
              const SizedBox(height: 14),

              // Storage Condition
              const Text('Cargo Storage Arrangement', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.ink)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(
                  color: AppColors.canvas,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.line),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _storageCondition,
                    isExpanded: true,
                    items: const [
                      DropdownMenuItem(value: 'AMBIENT', child: Text('Ambient Air Circulation', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'VENTILATED', child: Text('Mechanically Ventilated', style: TextStyle(fontSize: 13))),
                      DropdownMenuItem(value: 'COLD_CHAIN', child: Text('Active Cold Storage (12-14°C)', style: TextStyle(fontSize: 13))),
                    ],
                    onChanged: (val) {
                      if (val != null) setState(() => _storageCondition = val);
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../theme/colors.dart';
import '../../core/widgets/screen_layout.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_text_field.dart';
import '../../core/widgets/choice_chips.dart';
import '../../core/api/api_client.dart';
import '../../core/models/crop_model.dart';
import '../../core/models/farm_model.dart';
import '../../core/constants/app_constants.dart';
import '../../l10n/app_localizations.dart';
import '../farms/farm_service.dart';
import 'crop_service.dart';

class CropFormScreen extends StatefulWidget {
  final String? presetFarmId;

  const CropFormScreen({super.key, this.presetFarmId});

  @override
  State<CropFormScreen> createState() => _CropFormScreenState();
}

class _CropFormScreenState extends State<CropFormScreen> {
  final _formKey = GlobalKey<FormState>();
  int _currentStep = 0;
  bool _isSubmitting = false;
  String? _errorMessage;

  List<FarmModel> _farms = [];
  String? _selectedFarmId;

  String _district = 'Kurunegala';
  String _season = 'YALA';

  final _phController = TextEditingController(text: '6.5');
  final _nController = TextEditingController(text: '85');
  final _pController = TextEditingController(text: '42');
  final _kController = TextEditingController(text: '55');
  final _tempController = TextEditingController(text: '28');
  final _humidityController = TextEditingController(text: '78');
  final _rainfallController = TextEditingController(text: '140');

  late final ApiClient _apiClient;
  late final CropService _cropService;
  late final FarmService _farmService;

  @override
  void initState() {
    super.initState();
    _apiClient = Provider.of<ApiClient>(context, listen: false);
    _cropService = CropService(_apiClient);
    _farmService = FarmService(_apiClient);
    _selectedFarmId = widget.presetFarmId;
    _loadFarms();
  }

  Future<void> _loadFarms() async {
    try {
      final fList = await _farmService.getFarms();
      if (mounted) {
        setState(() {
          _farms = fList;
          if (_selectedFarmId != null) {
            final matched = fList.cast<FarmModel?>().firstWhere(
              (f) => f?.id == _selectedFarmId,
              orElse: () => null,
            );
            if (matched != null) {
              _district = matched.district;
            }
          }
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _phController.dispose();
    _nController.dispose();
    _pController.dispose();
    _kController.dispose();
    _tempController.dispose();
    _humidityController.dispose();
    _rainfallController.dispose();
    super.dispose();
  }

  void _autoFillAverages() {
    setState(() {
      _tempController.text = '28';
      _humidityController.text = '80';
      _rainfallController.text = '160';
    });
  }

  Future<void> _submit() async {
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final input = RecommendCropInput(
        n: double.tryParse(_nController.text.trim()) ?? 80,
        p: double.tryParse(_pController.text.trim()) ?? 40,
        k: double.tryParse(_kController.text.trim()) ?? 50,
        ph: double.tryParse(_phController.text.trim()) ?? 6.5,
        temperature: double.tryParse(_tempController.text.trim()) ?? 28,
        humidity: double.tryParse(_humidityController.text.trim()) ?? 80,
        rainfall: double.tryParse(_rainfallController.text.trim()) ?? 150,
        season: _season,
        district: _district,
        farmId: _selectedFarmId,
      );

      final result = await _cropService.recommendCrop(input);

      if (mounted) {
        Navigator.pushNamed(
          context,
          '/crop/results',
          arguments: {'result': result, 'crop': result.recommendedCrop},
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
      title: l10n.fCropTitle,
      subtitle: '${l10n.officialName}: ${l10n.fCropOfficial}',
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
                  _buildTab(0, '1. Land & Season'),
                  _buildTab(1, '2. Soil Nutrients'),
                  _buildTab(2, '3. Weather'),
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
                    label: _currentStep == 2 ? l10n.showCrops : l10n.next,
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
        if (_farms.isNotEmpty) ...[
          const Text(
            'Associated Farm (Optional)',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.ink),
          ),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.line),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String?>(
                value: _selectedFarmId,
                isExpanded: true,
                hint: const Text('None (Manual Context)', style: TextStyle(fontSize: 13, color: AppColors.muted)),
                items: [
                  const DropdownMenuItem<String?>(
                    value: null,
                    child: Text('None (Manual Context)', style: TextStyle(fontSize: 13, color: AppColors.muted)),
                  ),
                  ..._farms.map((f) => DropdownMenuItem<String?>(
                        value: f.id,
                        child: Text('${f.farmName} (${f.district})', style: const TextStyle(fontSize: 13, color: AppColors.ink)),
                      )),
                ],
                onChanged: (val) {
                  setState(() {
                    _selectedFarmId = val;
                    if (val != null) {
                      final f = _farms.firstWhere((x) => x.id == val);
                      _district = f.district;
                    }
                  });
                },
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],

        // District
        const Text(
          'District / Agro-Ecological Region',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.ink),
        ),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.line),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: AppConstants.districts.contains(_district) ? _district : AppConstants.districts.first,
              isExpanded: true,
              items: AppConstants.districts.map((d) {
                return DropdownMenuItem<String>(
                  value: d,
                  child: Text(d, style: const TextStyle(fontSize: 13, color: AppColors.ink)),
                );
              }).toList(),
              onChanged: (val) {
                if (val != null) setState(() => _district = val);
              },
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Season
        ChoiceChips<String>(
          label: 'Agricultural Season',
          options: [
            ChipOption(value: 'YALA', label: 'Yala (Apr - Aug)'),
            ChipOption(value: 'MAHA', label: 'Maha (Oct - Mar)'),
          ],
          selected: _season,
          onSelected: (val) => setState(() => _season = val),
        ),
      ],
    );
  }

  Widget _buildStep2(AppLocalizations l10n) {
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
                'SOIL CHEMISTRY & NUTRIENTS',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 14),
              AppTextField(
                label: l10n.soilPh,
                hint: '6.5 (Typical range: 4.5 - 8.5)',
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                controller: _phController,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: 'Nitrogen (N) kg/ha',
                      hint: '85',
                      keyboardType: TextInputType.number,
                      controller: _nController,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: AppTextField(
                      label: 'Phosphorus (P) kg/ha',
                      hint: '42',
                      keyboardType: TextInputType.number,
                      controller: _pController,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: AppTextField(
                      label: 'Potassium (K) kg/ha',
                      hint: '55',
                      keyboardType: TextInputType.number,
                      controller: _kController,
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
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'WEATHER & CLIMATE OBSERVATIONS',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                      color: AppColors.ink,
                    ),
                  ),
                  TextButton.icon(
                    onPressed: _autoFillAverages,
                    icon: const Icon(Icons.auto_fix_high, size: 14, color: AppColors.brand),
                    label: const Text(
                      'Auto Fill',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.brand),
                    ),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: 'Temperature (°C)',
                      hint: '28',
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      controller: _tempController,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: AppTextField(
                      label: 'Humidity (%)',
                      hint: '78',
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      controller: _humidityController,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              AppTextField(
                label: 'Rainfall (mm/season)',
                hint: '140',
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                controller: _rainfallController,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

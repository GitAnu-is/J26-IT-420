import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../theme/colors.dart';
import '../../core/widgets/screen_layout.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/choice_chips.dart';
import '../../core/api/api_client.dart';
import '../../core/models/crop_model.dart';
import '../../core/models/farm_model.dart';
import '../../core/constants/app_constants.dart';
import '../../l10n/app_localizations.dart';
import '../farms/farm_service.dart';
import '../crop_recommendation/crop_service.dart';

class HarvestFormScreen extends StatefulWidget {
  final String? initialCrop;

  const HarvestFormScreen({super.key, this.initialCrop});

  @override
  State<HarvestFormScreen> createState() => _HarvestFormScreenState();
}

class _HarvestFormScreenState extends State<HarvestFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isSubmitting = false;
  String? _errorMessage;

  List<FarmModel> _farms = [];
  String? _selectedFarmId;

  String _crop = AppConstants.cropBanana;
  DateTime _referenceDate = DateTime.now();
  String _district = 'Kurunegala';
  String _season = 'YALA';

  late final ApiClient _apiClient;
  late final CropService _cropService;
  late final FarmService _farmService;

  @override
  void initState() {
    super.initState();
    _apiClient = Provider.of<ApiClient>(context, listen: false);
    _cropService = CropService(_apiClient);
    _farmService = FarmService(_apiClient);
    if (widget.initialCrop != null) {
      _crop = widget.initialCrop!;
    }
    _loadFarms();
  }

  Future<void> _loadFarms() async {
    try {
      final fList = await _farmService.getFarms();
      if (mounted) {
        setState(() {
          _farms = fList;
          if (fList.isNotEmpty) {
            _selectedFarmId = fList.first.id;
            _district = fList.first.district;
          }
        });
      }
    } catch (_) {}
  }

  String get _referenceLabel {
    if (_crop == AppConstants.cropBlackPepper) {
      return 'Spike Emergence / Flowering Date';
    }
    return 'Planting Date';
  }

  String get _referenceHelp {
    if (_crop == AppConstants.cropBlackPepper) {
      return 'For Black Pepper, harvest maturity is predicted from the date flower spikes emerge, not nursery planting.';
    }
    return 'Date sucker or planting material was planted in the field.';
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _referenceDate,
      firstDate: DateTime(2020),
      lastDate: DateTime(2035),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.brand,
              onPrimary: Colors.white,
              onSurface: AppColors.ink,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() => _referenceDate = picked);
    }
  }

  Future<void> _submit() async {
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      final input = PredictHarvestInput(
        crop: _crop,
        referenceDate: _referenceDate,
        district: _district,
        season: _season,
        farmId: _selectedFarmId,
      );

      final result = await _cropService.predictHarvest(input);

      if (mounted) {
        Navigator.pushNamed(
          context,
          '/harvest/results',
          arguments: {
            'result': result,
            'crop': _crop,
            'referenceDate': _referenceDate,
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
    final dateFormat = DateFormat('MMM d, yyyy');

    return ScreenLayout(
      showBack: true,
      title: l10n.fHarvestTitle,
      subtitle: '${l10n.officialName}: ${l10n.fHarvestOfficial}',
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

            // Crop Choice
            ChoiceChips<String>(
              label: l10n.cropType,
              options: [
                ChipOption(value: AppConstants.cropBanana, label: '${l10n.cropBanana} (Planting Date)'),
                ChipOption(value: AppConstants.cropPineapple, label: '${l10n.cropPineapple} (Planting Date)'),
                ChipOption(value: AppConstants.cropBlackPepper, label: '${l10n.cropBlackPepper} (Spike/Flowering)'),
              ],
              selected: _crop,
              onSelected: (val) => setState(() => _crop = val),
            ),
            const SizedBox(height: 20),

            // Reference Event Date Picker
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
                  Text(
                    _referenceLabel,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _referenceHelp,
                    style: const TextStyle(fontSize: 11, color: AppColors.muted),
                  ),
                  const SizedBox(height: 14),
                  InkWell(
                    onTap: _pickDate,
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                      decoration: BoxDecoration(
                        color: AppColors.canvas,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.line),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.calendar_month, color: AppColors.brand, size: 20),
                          const SizedBox(width: 10),
                          Text(
                            dateFormat.format(_referenceDate),
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: AppColors.ink,
                            ),
                          ),
                          const Spacer(),
                          const Text(
                            'Change',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.brand,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Farm context & District
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
                    'LOCATION & GROWING SEASON',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 14),
                  if (_farms.isNotEmpty) ...[
                    const Text(
                      'Associated Farm',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.ink),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: AppColors.canvas,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.line),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String?>(
                          value: _selectedFarmId,
                          isExpanded: true,
                          items: [
                            const DropdownMenuItem<String?>(
                              value: null,
                              child: Text('No Farm (Manual District)', style: TextStyle(fontSize: 13, color: AppColors.muted)),
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
                    const SizedBox(height: 12),
                  ],

                  // District
                  const Text(
                    'District',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.ink),
                  ),
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
                  const SizedBox(height: 12),

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
              ),
            ),
            const SizedBox(height: 28),

            AppButton(
              label: 'Calculate Harvest Schedule',
              icon: Icons.access_time_rounded,
              variant: AppButtonVariant.primary,
              isLoading: _isSubmitting,
              onPressed: _submit,
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

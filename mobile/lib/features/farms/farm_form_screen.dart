import 'package:flutter/material.dart';
import '../../core/constants/app_constants.dart';
import '../../core/models/farm_model.dart';
import '../../core/theme/colors.dart';
import '../../core/theme/typography.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_text_field.dart';
import '../../core/widgets/screen_layout.dart';
import '../../l10n/app_localizations.dart';
import 'farm_service.dart';

class FarmFormScreen extends StatefulWidget {
  final FarmService farmService;
  final FarmModel? farmToEdit;
  final VoidCallback onSaved;

  const FarmFormScreen({
    super.key,
    required this.farmService,
    this.farmToEdit,
    required this.onSaved,
  });

  @override
  State<FarmFormScreen> createState() => _FarmFormScreenState();
}

class _FarmFormScreenState extends State<FarmFormScreen> {
  final _nameController = TextEditingController();
  final _areaController = TextEditingController();
  String _selectedDistrict = 'Kurunegala';
  String _selectedSoil = 'SANDY_LOAM';
  String _selectedUnit = 'ACRES';
  final Set<String> _selectedCrops = {'BANANA'};

  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    if (widget.farmToEdit != null) {
      final f = widget.farmToEdit!;
      _nameController.text = f.farmName;
      _areaController.text = f.area != null ? f.area.toString() : '';
      _selectedDistrict = f.district;
      _selectedSoil = f.soilType;
      _selectedUnit = f.areaUnit;
      _selectedCrops.clear();
      _selectedCrops.addAll(f.supportedCrops);
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _areaController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() => _errorMessage = 'Please enter a farm name.');
      return;
    }

    setState(() {
      _errorMessage = null;
      _isSubmitting = true;
    });

    final farm = FarmModel(
      id: widget.farmToEdit?.id ?? '',
      farmName: name,
      district: _selectedDistrict,
      soilType: _selectedSoil,
      area: double.tryParse(_areaController.text.trim()),
      areaUnit: _selectedUnit,
      supportedCrops: _selectedCrops.toList(),
    );

    try {
      if (widget.farmToEdit != null) {
        await widget.farmService.updateFarm(widget.farmToEdit!.id, farm.toJson());
      } else {
        await widget.farmService.createFarm(farm);
      }
      widget.onSaved();
    } catch (e) {
      setState(() => _errorMessage = e.toString().replaceAll('ApiException: ', ''));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isEditing = widget.farmToEdit != null;

    return ScreenLayout(
      showBack: true,
      title: isEditing ? l10n.t('editFarm') : l10n.t('addFarm'),
      subtitle: 'Provide land parcel soil and regional specifications',
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_errorMessage != null)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.dangerTint,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.danger.withOpacity(0.3)),
              ),
              child: Text(_errorMessage!, style: const TextStyle(color: AppColors.dangerInk, fontSize: 12)),
            ),

          AppTextField(
            label: l10n.t('farmName'),
            hint: 'e.g. Mahaweli Block A',
            controller: _nameController,
          ),
          const SizedBox(height: 16),

          // District Dropdown
          Text(l10n.t('district'), style: AppTypography.heading3.copyWith(fontSize: 14)),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.line),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedDistrict,
                isExpanded: true,
                items: AppConstants.districts
                    .map((d) => DropdownMenuItem(value: d, child: Text(d, style: AppTypography.body)))
                    .toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _selectedDistrict = val);
                },
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Soil Type Dropdown
          Text(l10n.t('soilType'), style: AppTypography.heading3.copyWith(fontSize: 14)),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.line),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedSoil,
                isExpanded: true,
                items: AppConstants.soilTypes
                    .map((s) => DropdownMenuItem(
                          value: s,
                          child: Text(s.replaceAll('_', ' '), style: AppTypography.body),
                        ))
                    .toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _selectedSoil = val);
                },
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Area and Unit
          Row(
            children: [
              Expanded(
                flex: 2,
                child: AppTextField(
                  label: l10n.t('area'),
                  hint: 'e.g. 2.5',
                  controller: _areaController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 1,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Unit', style: AppTypography.heading3.copyWith(fontSize: 14)),
                    const SizedBox(height: 6),
                    Container(
                      height: 52,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.line),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedUnit,
                          isExpanded: true,
                          items: const [
                            DropdownMenuItem(value: 'ACRES', child: Text('Acres')),
                            DropdownMenuItem(value: 'HECTARES', child: Text('Hectares')),
                          ],
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedUnit = val);
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Supported Crops
          Text(l10n.t('supportedCrops'), style: AppTypography.heading3.copyWith(fontSize: 14)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: AppConstants.supportedCrops.map((crop) {
              final isChecked = _selectedCrops.contains(crop);
              return FilterChip(
                label: Text(crop.replaceAll('_', ' ')),
                selected: isChecked,
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _selectedCrops.add(crop);
                    } else if (_selectedCrops.length > 1) {
                      _selectedCrops.remove(crop);
                    }
                  });
                },
                selectedColor: AppColors.brandTint,
                checkmarkColor: AppColors.brandDark,
                backgroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                side: BorderSide(color: isChecked ? AppColors.brand : AppColors.line),
              );
            }).toList(),
          ),
          const SizedBox(height: 28),

          AppButton(
            text: _isSubmitting ? l10n.t('loading') : l10n.t('save'),
            isLoading: _isSubmitting,
            onPressed: _handleSubmit,
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

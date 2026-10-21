import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../theme/colors.dart';
import '../../core/widgets/screen_layout.dart';
import '../../core/widgets/app_button.dart';
import '../../core/widgets/app_text_field.dart';
import '../../core/widgets/choice_chips.dart';
import '../../core/api/api_client.dart';
import '../../core/models/record_model.dart';
import '../../core/models/farm_model.dart';
import '../../core/constants/app_constants.dart';
import '../../l10n/app_localizations.dart';
import '../farms/farm_service.dart';
import 'record_service.dart';

class RecordFormScreen extends StatefulWidget {
  final String? recordId;
  final AgriculturalRecordModel? initialRecord;
  final String? presetFarmId;
  final String? initialCrop;
  final DateTime? initialPlantingDate;
  final DateTime? initialExpectedHarvestDate;

  const RecordFormScreen({
    super.key,
    this.recordId,
    this.initialRecord,
    this.presetFarmId,
    this.initialCrop,
    this.initialPlantingDate,
    this.initialExpectedHarvestDate,
  });

  @override
  State<RecordFormScreen> createState() => _RecordFormScreenState();
}

class _RecordFormScreenState extends State<RecordFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  bool _isSaving = false;
  String? _errorMessage;

  List<FarmModel> _farms = [];
  String? _selectedFarmId;
  late String _cropType;
  late DateTime _plantingDate;
  DateTime? _expectedHarvestDate;

  final _phController = TextEditingController();
  final _nController = TextEditingController();
  final _pController = TextEditingController();
  final _kController = TextEditingController();
  final _moistureController = TextEditingController();
  final _notesController = TextEditingController();

  late final ApiClient _apiClient;
  late final RecordService _recordService;
  late final FarmService _farmService;

  bool get _isEditing => widget.recordId != null || widget.initialRecord != null;

  @override
  void initState() {
    super.initState();
    _cropType = widget.initialCrop ?? AppConstants.cropBanana;
    _plantingDate = widget.initialPlantingDate ?? DateTime.now();
    _expectedHarvestDate = widget.initialExpectedHarvestDate;
    _apiClient = Provider.of<ApiClient>(context, listen: false);
    _recordService = RecordService(_apiClient);
    _farmService = FarmService(_apiClient);
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    setState(() => _isLoading = true);
    try {
      final farms = await _farmService.getFarms();
      _farms = farms;

      if (widget.initialRecord != null) {
        _populateFields(widget.initialRecord!);
      } else if (widget.recordId != null) {
        final rec = await _recordService.getRecordById(widget.recordId!);
        _populateFields(rec);
      } else {
        _selectedFarmId = widget.presetFarmId ?? (farms.isNotEmpty ? farms.first.id : null);
      }
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _populateFields(AgriculturalRecordModel rec) {
    _selectedFarmId = rec.farmId;
    _cropType = rec.cropType;
    _plantingDate = rec.plantingDate;
    _expectedHarvestDate = rec.expectedHarvestDate;
    if (rec.soilPh != null) _phController.text = rec.soilPh.toString();
    if (rec.nitrogen != null) _nController.text = rec.nitrogen.toString();
    if (rec.phosphorus != null) _pController.text = rec.phosphorus.toString();
    if (rec.potassium != null) _kController.text = rec.potassium.toString();
    if (rec.soilMoisture != null) _moistureController.text = rec.soilMoisture.toString();
    if (rec.notes != null) _notesController.text = rec.notes!;
  }

  @override
  void dispose() {
    _phController.dispose();
    _nController.dispose();
    _pController.dispose();
    _kController.dispose();
    _moistureController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickDate({required bool isPlanting}) async {
    final initialDate = isPlanting ? _plantingDate : (_expectedHarvestDate ?? _plantingDate.add(const Duration(days: 90)));
    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
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
      setState(() {
        if (isPlanting) {
          _plantingDate = picked;
        } else {
          _expectedHarvestDate = picked;
        }
      });
    }
  }

  Future<void> _saveRecord() async {
    if (_selectedFarmId == null || _selectedFarmId!.isEmpty) {
      setState(() => _errorMessage = 'Please select a registered farm');
      return;
    }

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    try {
      final double? ph = double.tryParse(_phController.text.trim());
      final int? n = int.tryParse(_nController.text.trim());
      final int? p = int.tryParse(_pController.text.trim());
      final int? k = int.tryParse(_kController.text.trim());
      final double? moisture = double.tryParse(_moistureController.text.trim());
      final String? notes = _notesController.text.trim().isEmpty ? null : _notesController.text.trim();

      if (_isEditing) {
        final id = widget.recordId ?? widget.initialRecord?.id;
        final updates = <String, dynamic>{
          'cropType': _cropType,
          'plantingDate': _plantingDate.toIso8601String().split('T')[0],
          if (_expectedHarvestDate != null)
            'expectedHarvestDate': _expectedHarvestDate!.toIso8601String().split('T')[0],
          if (ph != null) 'soilPh': ph,
          if (n != null) 'nitrogen': n,
          if (p != null) 'phosphorus': p,
          if (k != null) 'potassium': k,
          if (moisture != null) 'soilMoisture': moisture,
          if (notes != null) 'notes': notes,
        };
        await _recordService.updateRecord(id!, updates);
      } else {
        final newRecord = AgriculturalRecordModel(
          id: '',
          farmId: _selectedFarmId,
          cropType: _cropType,
          plantingDate: _plantingDate,
          expectedHarvestDate: _expectedHarvestDate,
          soilPh: ph,
          nitrogen: n,
          phosphorus: p,
          potassium: k,
          soilMoisture: moisture,
          notes: notes,
        );
        await _recordService.createRecord(newRecord);
      }

      if (mounted) {
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
          _isSaving = false;
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
      title: _isEditing ? l10n.editRecord : l10n.addRecord,
      subtitle: 'Save crop planting event and soil chemistry context',
      child: _isLoading
          ? const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: CircularProgressIndicator(color: AppColors.brand),
              ),
            )
          : Form(
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
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(
                          color: AppColors.dangerInk,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Farm selector
                  Text(
                    'Associated Farm',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 6),
                  if (_farms.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.canvas,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.line),
                      ),
                      child: const Text(
                        'No farms registered. Please register a farm first.',
                        style: TextStyle(fontSize: 12, color: AppColors.muted),
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.line),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: _selectedFarmId,
                          isExpanded: true,
                          icon: const Icon(Icons.arrow_drop_down, color: AppColors.muted),
                          items: _farms.map((f) {
                            return DropdownMenuItem<String>(
                              value: f.id,
                              child: Text(
                                '${f.farmName} (${f.district})',
                                style: const TextStyle(fontSize: 13, color: AppColors.ink),
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => _selectedFarmId = val);
                          },
                        ),
                      ),
                    ),
                  const SizedBox(height: 16),

                  // Crop selection chips
                  ChoiceChips<String>(
                    label: l10n.cropType,
                    options: [
                      ChipOption(value: AppConstants.cropBanana, label: l10n.cropBanana),
                      ChipOption(value: AppConstants.cropPineapple, label: l10n.cropPineapple),
                      ChipOption(value: AppConstants.cropBlackPepper, label: l10n.cropBlackPepper),
                    ],
                    selected: _cropType,
                    onSelected: (val) => setState(() => _cropType = val),
                  ),
                  const SizedBox(height: 16),

                  // Planting and Expected Harvest dates
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              l10n.plantingDate,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: AppColors.ink,
                              ),
                            ),
                            const SizedBox(height: 6),
                            InkWell(
                              onTap: () => _pickDate(isPlanting: true),
                              borderRadius: BorderRadius.circular(16),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: AppColors.line),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.calendar_today, size: 16, color: AppColors.muted),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        dateFormat.format(_plantingDate),
                                        style: const TextStyle(fontSize: 12, color: AppColors.ink),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  l10n.expectedHarvest,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.ink,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                const Text('(opt)', style: TextStyle(fontSize: 11, color: AppColors.muted)),
                              ],
                            ),
                            const SizedBox(height: 6),
                            InkWell(
                              onTap: () => _pickDate(isPlanting: false),
                              borderRadius: BorderRadius.circular(16),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: AppColors.line),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.event_available, size: 16, color: AppColors.brand),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        _expectedHarvestDate != null
                                            ? dateFormat.format(_expectedHarvestDate!)
                                            : 'Not set',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: _expectedHarvestDate != null ? AppColors.ink : AppColors.muted,
                                        ),
                                      ),
                                    ),
                                    if (_expectedHarvestDate != null)
                                      GestureDetector(
                                        onTap: () => setState(() => _expectedHarvestDate = null),
                                        child: const Icon(Icons.close, size: 14, color: AppColors.muted),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Soil chemistry card
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
                          'SOIL CHEMISTRY (OPTIONAL FOR AI CONTEXT)',
                          style: TextStyle(
                            fontSize: 11,
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
                                label: l10n.soilPh,
                                hint: '6.5',
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                controller: _phController,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: AppTextField(
                                label: 'Moisture (%)',
                                hint: '30.0',
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                controller: _moistureController,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: AppTextField(
                                label: 'Nitrogen (N)',
                                hint: '100',
                                keyboardType: TextInputType.number,
                                controller: _nController,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: AppTextField(
                                label: 'Phosphorus (P)',
                                hint: '50',
                                keyboardType: TextInputType.number,
                                controller: _pController,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: AppTextField(
                                label: 'Potassium (K)',
                                hint: '150',
                                keyboardType: TextInputType.number,
                                controller: _kController,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Notes
                  AppTextField(
                    label: 'Field Observation Notes',
                    hint: 'Enter any soil treatment, canopy status, or irrigation notes...',
                    controller: _notesController,
                    maxLines: 3,
                  ),
                  const SizedBox(height: 24),

                  // Submit button
                  AppButton(
                    label: _isEditing ? 'Save Changes' : 'Create Record',
                    variant: AppButtonVariant.primary,
                    isLoading: _isSaving,
                    onPressed: _saveRecord,
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }
}

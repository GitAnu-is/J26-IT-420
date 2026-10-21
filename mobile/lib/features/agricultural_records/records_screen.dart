import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../theme/colors.dart';
import '../../core/widgets/screen_layout.dart';
import '../../core/widgets/app_button.dart';
import '../../core/api/api_client.dart';
import '../../core/models/record_model.dart';
import '../../core/models/farm_model.dart';
import '../../l10n/app_localizations.dart';
import '../farms/farm_service.dart';
import 'record_service.dart';

class RecordsScreen extends StatefulWidget {
  const RecordsScreen({super.key});

  @override
  State<RecordsScreen> createState() => _RecordsScreenState();
}

class _RecordsScreenState extends State<RecordsScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  List<AgriculturalRecordModel> _records = [];
  List<FarmModel> _farms = [];
  String? _selectedFarmId;

  late final ApiClient _apiClient;
  late final RecordService _recordService;
  late final FarmService _farmService;

  @override
  void initState() {
    super.initState();
    _apiClient = Provider.of<ApiClient>(context, listen: false);
    _recordService = RecordService(_apiClient);
    _farmService = FarmService(_apiClient);
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final results = await Future.wait([
        _recordService.getRecords(farmId: _selectedFarmId),
        _farmService.getFarms(),
      ]);

      if (mounted) {
        setState(() {
          _records = results[0] as List<AgriculturalRecordModel>;
          _farms = results[1] as List<FarmModel>;
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

  String _getFarmName(String? farmId) {
    if (farmId == null) return 'Registered Farm';
    final farm = _farms.cast<FarmModel?>().firstWhere(
      (f) => f?.id == farmId,
      orElse: () => null,
    );
    return farm?.farmName ?? 'Registered Farm';
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final dateFormat = DateFormat('MMM d, yyyy');

    return ScreenLayout(
      title: l10n.navRecords,
      subtitle: 'Track your planting cycles, soil parameters, and harvest timelines',
      action: AppButton(
        label: l10n.addRecord,
        icon: Icons.add,
        variant: AppButtonVariant.primary,
        onPressed: () async {
          final res = await Navigator.pushNamed(context, '/records/new');
          if (res == true) _loadData();
        },
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_farms.isNotEmpty) ...[
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  ChoiceChip(
                    label: const Text('All Farms'),
                    selected: _selectedFarmId == null,
                    selectedColor: AppColors.brand,
                    labelStyle: TextStyle(
                      color: _selectedFarmId == null ? Colors.white : AppColors.ink,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                    onSelected: (selected) {
                      if (selected) {
                        setState(() => _selectedFarmId = null);
                        _loadData();
                      }
                    },
                  ),
                  const SizedBox(width: 8),
                  ..._farms.map((f) {
                    final isSel = _selectedFarmId == f.id;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(f.farmName),
                        selected: isSel,
                        selectedColor: AppColors.brand,
                        labelStyle: TextStyle(
                          color: isSel ? Colors.white : AppColors.ink,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                        onSelected: (selected) {
                          setState(() => _selectedFarmId = selected ? f.id : null);
                          _loadData();
                        },
                      ),
                    );
                  }),
                ],
              ),
            ),
          ],
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 48),
              child: Center(
                child: Column(
                  children: [
                    CircularProgressIndicator(color: AppColors.brand),
                    SizedBox(height: 12),
                    Text(
                      'Loading field records...',
                      style: TextStyle(fontSize: 13, color: AppColors.muted),
                    ),
                  ],
                ),
              ),
            )
          else if (_errorMessage != null)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.dangerTint,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.danger.withOpacity(0.3)),
              ),
              child: Column(
                children: [
                  const Icon(Icons.error_outline, color: AppColors.danger, size: 36),
                  const SizedBox(height: 8),
                  Text(
                    _errorMessage!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: AppColors.dangerInk,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 16),
                  AppButton(
                    label: l10n.retry,
                    variant: AppButtonVariant.secondary,
                    onPressed: _loadData,
                  ),
                ],
              ),
            )
          else if (_records.isEmpty)
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.line),
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.canvas,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.assignment_outlined, size: 40, color: AppColors.muted),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    l10n.noRecordsTitle,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n.noRecordsBody,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 13, color: AppColors.muted),
                  ),
                  const SizedBox(height: 20),
                  AppButton(
                    label: l10n.addRecord,
                    icon: Icons.add,
                    variant: AppButtonVariant.primary,
                    onPressed: () async {
                      final res = await Navigator.pushNamed(context, '/records/new');
                      if (res == true) _loadData();
                    },
                  ),
                ],
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _records.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final rec = _records[index];
                final cropDisplay = rec.cropType.replaceAll('_', ' ');

                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
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
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.brandTint,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.eco, size: 14, color: AppColors.brand),
                                const SizedBox(width: 4),
                                Text(
                                  cropDisplay,
                                  style: const TextStyle(
                                    color: AppColors.brandDark,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            _getFarmName(rec.farmId),
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.muted,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          const Icon(Icons.calendar_today_outlined, size: 14, color: AppColors.muted),
                          const SizedBox(width: 6),
                          Text(
                            'Planted: ${dateFormat.format(rec.plantingDate)}',
                            style: const TextStyle(fontSize: 13, color: AppColors.ink),
                          ),
                        ],
                      ),
                      if (rec.expectedHarvestDate != null) ...[
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(Icons.event_available, size: 14, color: AppColors.brand),
                            const SizedBox(width: 6),
                            Text(
                              'Expected Harvest: ${dateFormat.format(rec.expectedHarvestDate!)}',
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppColors.brandDark,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                      if (rec.soilPh != null || rec.soilMoisture != null || rec.nitrogen != null) ...[
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: [
                            if (rec.soilPh != null)
                              _buildParamPill('pH ${rec.soilPh}'),
                            if (rec.soilMoisture != null)
                              _buildParamPill('Moisture ${rec.soilMoisture}%'),
                            if (rec.nitrogen != null)
                              _buildParamPill('N: ${rec.nitrogen}'),
                            if (rec.phosphorus != null)
                              _buildParamPill('P: ${rec.phosphorus}'),
                            if (rec.potassium != null)
                              _buildParamPill('K: ${rec.potassium}'),
                          ],
                        ),
                      ],
                      if (rec.notes != null && rec.notes!.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Text(
                          '"${rec.notes}"',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 12,
                            fontStyle: FontStyle.italic,
                            color: AppColors.muted,
                          ),
                        ),
                      ],
                      const SizedBox(height: 12),
                      const Divider(height: 1, color: AppColors.line),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          TextButton.icon(
                            icon: const Icon(Icons.edit_outlined, size: 14, color: AppColors.brand),
                            label: Text(
                              l10n.editRecord,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: AppColors.brand,
                              ),
                            ),
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            onPressed: () async {
                              final res = await Navigator.pushNamed(
                                context,
                                '/records/edit',
                                arguments: {'id': rec.id, 'record': rec},
                              );
                              if (res == true) _loadData();
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildParamPill(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.canvas,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.line),
      ),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w500,
          color: AppColors.ink,
        ),
      ),
    );
  }
}

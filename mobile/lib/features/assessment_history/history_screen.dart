import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../theme/colors.dart';
import '../../core/widgets/screen_layout.dart';
import '../../core/widgets/app_button.dart';
import '../../core/api/api_client.dart';
import '../../l10n/app_localizations.dart';
import '../crop_recommendation/crop_service.dart';
import '../disease_detection/disease_service.dart';
import '../transportation_risk/transport_service.dart';

class UnifiedHistoryItem {
  final String id;
  final String type; // crop, harvest, disease, transport
  final String title;
  final String subtitle;
  final DateTime date;
  final String? level;
  final double? probability;

  UnifiedHistoryItem({
    required this.id,
    required this.type,
    required this.title,
    required this.subtitle,
    required this.date,
    this.level,
    this.probability,
  });
}

class HistoryScreen extends StatefulWidget {
  final String? initialFilter;

  const HistoryScreen({super.key, this.initialFilter});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  String _filter = 'all'; // all, crop, harvest, disease, transport
  String _searchQuery = '';
  final _searchController = TextEditingController();

  bool _isLoading = true;
  String? _errorMessage;
  List<UnifiedHistoryItem> _items = [];

  late final ApiClient _apiClient;
  late final CropService _cropService;
  late final DiseaseService _diseaseService;
  late final TransportService _transportService;

  @override
  void initState() {
    super.initState();
    _apiClient = Provider.of<ApiClient>(context, listen: false);
    _cropService = CropService(_apiClient);
    _diseaseService = DiseaseService(_apiClient);
    _transportService = TransportService(_apiClient);
    if (widget.initialFilter != null) {
      _filter = widget.initialFilter!;
    }
    _loadHistory();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final results = await Future.wait([
        _cropService.getCropHistory().catchError((_) => []),
        _diseaseService.getDiseaseHistory().catchError((_) => []),
        _transportService.getTransportationHistory().catchError((_) => []),
      ]);

      final cropItems = results[0];
      final diseaseItems = results[1];
      final transportItems = results[2];

      final List<UnifiedHistoryItem> unified = [];

      for (final item in cropItems) {
        if (item is Map) {
          final isHarvest = item['predictionType'] == 'HARVEST_PLANNING';
          final cropName = (item['crop'] ?? item['recommendedCrop'] ?? 'BANANA').toString().replaceAll('_', ' ');
          final dt = item['createdAt'] != null ? DateTime.tryParse(item['createdAt'].toString()) ?? DateTime.now() : DateTime.now();

          unified.add(UnifiedHistoryItem(
            id: item['id']?.toString() ?? item['_id']?.toString() ?? '',
            type: isHarvest ? 'harvest' : 'crop',
            title: isHarvest ? '$cropName Harvest Target' : 'Recommended: $cropName',
            subtitle: isHarvest && item['expectedHarvestDate'] != null
                ? 'Target: ${item['expectedHarvestDate']}'
                : 'Confidence: ${((item['confidence'] as num?)?.toDouble() ?? 0.85 * 100).round()}%',
            date: dt,
          ));
        }
      }

      for (final item in diseaseItems) {
        if (item is Map) {
          final cropName = (item['crop'] ?? item['cropType'] ?? 'BANANA').toString().replaceAll('_', ' ');
          final diseaseName = item['diseaseName'] ?? item['classification'] ?? 'Foliar Assessment';
          final dt = item['createdAt'] != null ? DateTime.tryParse(item['createdAt'].toString()) ?? DateTime.now() : DateTime.now();
          final conf = ((item['confidence'] as num?)?.toDouble() ?? 0.88 * 100).round();

          unified.add(UnifiedHistoryItem(
            id: item['id']?.toString() ?? item['_id']?.toString() ?? '',
            type: 'disease',
            title: '$cropName: $diseaseName',
            subtitle: 'Diagnosis Match: $conf%',
            date: dt,
          ));
        }
      }

      for (final item in transportItems) {
        if (item is Map) {
          final cropName = (item['crop'] ?? item['cropType'] ?? 'BANANA').toString().replaceAll('_', ' ');
          final dt = item['createdAt'] != null ? DateTime.tryParse(item['createdAt'].toString()) ?? DateTime.now() : DateTime.now();
          final dist = item['distanceKm'] ?? 100;
          final vehicle = (item['vehicleType'] ?? 'Truck').toString().replaceAll('_', ' ');
          final riskLvl = (item['riskLevel'] ?? 'MEDIUM').toString().toUpperCase();
          final prob = (item['damageProbability'] as num?)?.toDouble() ?? 0.3;

          unified.add(UnifiedHistoryItem(
            id: item['id']?.toString() ?? item['_id']?.toString() ?? '',
            type: 'transport',
            title: '$cropName Damage Risk',
            subtitle: '$dist km transit · $vehicle',
            date: dt,
            level: riskLvl,
            probability: prob,
          ));
        }
      }

      unified.sort((a, b) => b.date.compareTo(a.date));

      if (mounted) {
        setState(() {
          _items = unified;
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

  List<UnifiedHistoryItem> get _filteredItems {
    return _items.where((item) {
      final matchesFilter = _filter == 'all' || item.type == _filter;
      final q = _searchQuery.trim().toLowerCase();
      final matchesQuery = q.isEmpty ||
          item.title.toLowerCase().contains(q) ||
          item.subtitle.toLowerCase().contains(q);
      return matchesFilter && matchesQuery;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final dateFormat = DateFormat('MMM d, yyyy · HH:mm');
    final filtered = _filteredItems;

    return ScreenLayout(
      showBack: false,
      title: l10n.historyTitle,
      subtitle: 'Audit trail of ML predictions, disease scans, and transit evaluations',
      action: IconButton(
        icon: const Icon(Icons.refresh, color: AppColors.brand),
        onPressed: _loadHistory,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Search Bar
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.line),
            ),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => setState(() => _searchQuery = val),
              decoration: const InputDecoration(
                hintText: 'Search assessments, crops, diseases...',
                prefixIcon: Icon(Icons.search, color: AppColors.muted),
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('all', 'All Records'),
                const SizedBox(width: 8),
                _buildFilterChip('crop', 'Crop Recom'),
                const SizedBox(width: 8),
                _buildFilterChip('harvest', 'Harvest'),
                const SizedBox(width: 8),
                _buildFilterChip('disease', 'Disease Scans'),
                const SizedBox(width: 8),
                _buildFilterChip('transport', 'Transport Risk'),
              ],
            ),
          ),
          const SizedBox(height: 16),

          if (_isLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 48),
              child: Center(
                child: Column(
                  children: [
                    CircularProgressIndicator(color: AppColors.brand),
                    SizedBox(height: 12),
                    Text('Loading assessment history...', style: TextStyle(fontSize: 13, color: AppColors.muted)),
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
              ),
              child: Column(
                children: [
                  const Icon(Icons.error_outline, color: AppColors.danger, size: 36),
                  const SizedBox(height: 8),
                  Text(_errorMessage!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.dangerInk)),
                  const SizedBox(height: 14),
                  AppButton(label: l10n.retry, variant: AppButtonVariant.secondary, onPressed: _loadHistory),
                ],
              ),
            )
          else if (filtered.isEmpty)
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.line),
              ),
              child: const Column(
                children: [
                  Icon(Icons.history_toggle_off, size: 48, color: AppColors.muted),
                  SizedBox(height: 14),
                  Text(
                    'No assessment records found',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.ink),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'Perform a crop recommendation, foliar diagnosis, or transportation risk check to see it logged here.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: AppColors.muted),
                  ),
                ],
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: filtered.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final item = filtered[index];
                final IconData iconData;
                final Color iconBg;
                final Color iconColor;

                switch (item.type) {
                  case 'crop':
                    iconData = Icons.eco_outlined;
                    iconBg = AppColors.brandTint;
                    iconColor = AppColors.brand;
                    break;
                  case 'harvest':
                    iconData = Icons.calendar_today_outlined;
                    iconBg = AppColors.brandTint;
                    iconColor = AppColors.brandDark;
                    break;
                  case 'disease':
                    iconData = Icons.coronavirus_outlined;
                    iconBg = AppColors.dangerTint;
                    iconColor = AppColors.danger;
                    break;
                  case 'transport':
                  default:
                    iconData = Icons.local_shipping_outlined;
                    iconBg = AppColors.warnTint;
                    iconColor = AppColors.warnInk;
                    break;
                }

                return Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.line),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.02),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: iconBg,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Icon(iconData, color: iconColor, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.title,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: AppColors.ink,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              item.subtitle,
                              style: const TextStyle(fontSize: 11, color: AppColors.muted),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              dateFormat.format(item.date),
                              style: const TextStyle(fontSize: 10, color: AppColors.muted),
                            ),
                          ],
                        ),
                      ),
                      if (item.level != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: item.level == 'HIGH'
                                ? AppColors.dangerTint
                                : item.level == 'MEDIUM'
                                    ? AppColors.warnTint
                                    : AppColors.brandTint,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${item.level} RISK',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: item.level == 'HIGH'
                                  ? AppColors.danger
                                  : item.level == 'MEDIUM'
                                      ? AppColors.warnInk
                                      : AppColors.brandDark,
                            ),
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label) {
    final isSel = _filter == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSel,
      selectedColor: AppColors.brand,
      labelStyle: TextStyle(
        color: isSel ? Colors.white : AppColors.ink,
        fontWeight: FontWeight.bold,
        fontSize: 12,
      ),
      onSelected: (selected) {
        if (selected) setState(() => _filter = value);
      },
    );
  }
}

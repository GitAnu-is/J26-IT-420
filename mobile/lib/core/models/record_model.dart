class AgriculturalRecordModel {
  final String id;
  final String? farmId;
  final String cropType;
  final DateTime plantingDate;
  final DateTime? expectedHarvestDate;
  final double? soilMoisture;
  final double? soilPh;
  final int? nitrogen;
  final int? phosphorus;
  final int? potassium;
  final String? locationContext;
  final String? notes;

  AgriculturalRecordModel({
    required this.id,
    this.farmId,
    required this.cropType,
    required this.plantingDate,
    this.expectedHarvestDate,
    this.soilMoisture,
    this.soilPh,
    this.nitrogen,
    this.phosphorus,
    this.potassium,
    this.locationContext,
    this.notes,
  });

  factory AgriculturalRecordModel.fromJson(Map<String, dynamic> json) {
    return AgriculturalRecordModel(
      id: json['id'] ?? json['_id'] ?? '',
      farmId: json['farmId']?.toString(),
      cropType: json['cropType'] ?? 'BANANA',
      plantingDate: json['plantingDate'] != null
          ? DateTime.tryParse(json['plantingDate'].toString()) ?? DateTime.now()
          : DateTime.now(),
      expectedHarvestDate: json['expectedHarvestDate'] != null
          ? DateTime.tryParse(json['expectedHarvestDate'].toString())
          : null,
      soilMoisture: json['soilMoisture'] != null ? (json['soilMoisture'] as num).toDouble() : null,
      soilPh: json['soilPh'] != null ? (json['soilPh'] as num).toDouble() : null,
      nitrogen: json['nitrogen'] != null ? (json['nitrogen'] as num).toInt() : null,
      phosphorus: json['phosphorus'] != null ? (json['phosphorus'] as num).toInt() : null,
      potassium: json['potassium'] != null ? (json['potassium'] as num).toInt() : null,
      locationContext: json['locationContext'],
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() => {
    if (farmId != null) 'farmId': farmId,
    'cropType': cropType,
    'plantingDate': plantingDate.toIso8601String().split('T')[0],
    if (expectedHarvestDate != null) 'expectedHarvestDate': expectedHarvestDate!.toIso8601String().split('T')[0],
    if (soilMoisture != null) 'soilMoisture': soilMoisture,
    if (soilPh != null) 'soilPh': soilPh,
    if (nitrogen != null) 'nitrogen': nitrogen,
    if (phosphorus != null) 'phosphorus': phosphorus,
    if (potassium != null) 'potassium': potassium,
    if (locationContext != null) 'locationContext': locationContext,
    if (notes != null) 'notes': notes,
  };
}

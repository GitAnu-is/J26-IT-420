class FarmModel {
  final String id;
  final String farmName;
  final String district;
  final String? agroEcologicalZone;
  final String soilType;
  final double? area;
  final String areaUnit;
  final List<String> supportedCrops;

  FarmModel({
    required this.id,
    required this.farmName,
    required this.district,
    this.agroEcologicalZone,
    required this.soilType,
    this.area,
    this.areaUnit = 'ACRES',
    this.supportedCrops = const [],
  });

  double? get acres => area;

  factory FarmModel.fromJson(Map<String, dynamic> json) {
    List<String> crops = [];
    if (json['supportedCrops'] is List) {
      crops = (json['supportedCrops'] as List).map((e) => e.toString()).toList();
    }
    final rawArea = json['area'] ?? json['acres'];
    return FarmModel(
      id: json['id'] ?? json['_id'] ?? '',
      farmName: json['farmName'] ?? '',
      district: json['district'] ?? '',
      agroEcologicalZone: json['agroEcologicalZone'],
      soilType: json['soilType'] ?? 'SANDY_LOAM',
      area: rawArea != null ? (rawArea as num).toDouble() : null,
      areaUnit: json['areaUnit'] ?? 'ACRES',
      supportedCrops: crops,
    );
  }

  Map<String, dynamic> toJson() => {
    'farmName': farmName,
    'district': district,
    if (agroEcologicalZone != null) 'agroEcologicalZone': agroEcologicalZone,
    'soilType': soilType,
    if (area != null) 'area': area,
    'areaUnit': areaUnit,
    'supportedCrops': supportedCrops,
  };
}

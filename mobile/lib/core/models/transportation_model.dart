class PredictTransportationRiskInput {
  final String crop;
  final String? farmId;
  final double distanceKm;
  final double durationHours;
  final String vehicleType;
  final String packagingType;
  final String roadCondition;
  final double? temperatureCelsius;
  final double? humidityPercentage;
  final String? storageCondition;
  final String? weatherCondition;
  final String originDistrict;
  final String destinationDistrict;

  PredictTransportationRiskInput({
    required this.crop,
    this.farmId,
    required this.distanceKm,
    required this.durationHours,
    required this.vehicleType,
    required this.packagingType,
    required this.roadCondition,
    this.temperatureCelsius,
    this.humidityPercentage,
    this.storageCondition,
    this.weatherCondition,
    required this.originDistrict,
    required this.destinationDistrict,
  });

  Map<String, dynamic> toJson() => {
    'crop': crop,
    'cropType': crop,
    if (farmId != null) 'farmId': farmId,
    'distanceKm': distanceKm,
    'durationHours': durationHours,
    'vehicleType': vehicleType,
    'packagingType': packagingType,
    'roadCondition': roadCondition,
    if (temperatureCelsius != null) 'temperatureCelsius': temperatureCelsius,
    if (humidityPercentage != null) 'humidityPercentage': humidityPercentage,
    if (storageCondition != null) 'storageCondition': storageCondition,
    if (weatherCondition != null) 'weatherCondition': weatherCondition,
    'originDistrict': originDistrict,
    'destinationDistrict': destinationDistrict,
  };
}

class ShapContribution {
  final String featureName;
  final double shapValue;
  final dynamic featureValue;
  final String description;

  ShapContribution({
    required this.featureName,
    required this.shapValue,
    this.featureValue,
    required this.description,
  });

  factory ShapContribution.fromJson(String name, Map<String, dynamic> json) {
    return ShapContribution(
      featureName: json['featureName'] ?? name,
      shapValue: (json['shapValue'] as num?)?.toDouble() ?? 0.0,
      featureValue: json['featureValue'],
      description: json['description'] ?? '',
    );
  }
}

class TransportationRiskResult {
  final String id;
  final String cropType;
  final String riskLevel;
  final double damageProbability;
  final List<ShapContribution> topContributors;
  final List<String> packagingRecommendations;
  final List<String> handlingAdvice;
  final String? storageConditions;
  final String? ruleVersion;

  TransportationRiskResult({
    required this.id,
    required this.cropType,
    required this.riskLevel,
    required this.damageProbability,
    this.topContributors = const [],
    this.packagingRecommendations = const [],
    this.handlingAdvice = const [],
    this.storageConditions,
    this.ruleVersion,
  });

  factory TransportationRiskResult.fromJson(Map<String, dynamic> json) {
    List<ShapContribution> contributors = [];
    if (json['topContributors'] is List) {
      for (final item in json['topContributors']) {
        if (item is Map<String, dynamic>) {
          contributors.add(ShapContribution.fromJson(item['featureName'] ?? '', item));
        }
      }
    } else if (json['shapExplanation']?['contributions'] is Map) {
      (json['shapExplanation']['contributions'] as Map).forEach((k, v) {
        if (v is Map<String, dynamic>) {
          contributors.add(ShapContribution.fromJson(k.toString(), v));
        }
      });
    }

    List<String> packaging = [];
    if (json['packagingRecommendations'] is List) {
      packaging = (json['packagingRecommendations'] as List).map((e) => e.toString()).toList();
    }

    List<String> handling = [];
    if (json['handlingAdvice'] is List) {
      handling = (json['handlingAdvice'] as List).map((e) => e.toString()).toList();
    }

    return TransportationRiskResult(
      id: json['id'] ?? json['_id'] ?? '',
      cropType: json['cropType'] ?? json['crop'] ?? 'BANANA',
      riskLevel: json['riskLevel'] ?? 'MEDIUM',
      damageProbability: (json['damageProbability'] as num?)?.toDouble() ?? 0.25,
      topContributors: contributors,
      packagingRecommendations: packaging,
      handlingAdvice: handling,
      storageConditions: json['storageConditions']?.toString(),
      ruleVersion: json['ruleVersion']?.toString(),
    );
  }
}

class SmartPackagingResult {
  final String cropType;
  final String recommendedPackaging;
  final String cushioning;
  final String ventilation;
  final String stacking;
  final List<String> precautions;

  SmartPackagingResult({
    required this.cropType,
    required this.recommendedPackaging,
    required this.cushioning,
    required this.ventilation,
    required this.stacking,
    this.precautions = const [],
  });

  factory SmartPackagingResult.fromJson(Map<String, dynamic> json) {
    List<String> prec = [];
    if (json['transportPrecautions'] is List) {
      prec = (json['transportPrecautions'] as List).map((e) => e.toString()).toList();
    }
    return SmartPackagingResult(
      cropType: json['cropType'] ?? 'BANANA',
      recommendedPackaging: json['recommendedPackaging'] ?? json['packagingMaterial'] ?? 'Rigid Plastic Crates',
      cushioning: json['cushioning'] ?? json['cushioningMaterial'] ?? 'Dry banana leaves or foam netting',
      ventilation: json['ventilation'] ?? 'Ventilated sidewall slots',
      stacking: json['stacking'] ?? json['stackingLimits'] ?? 'Maximum 4 crates high',
      precautions: prec,
    );
  }
}

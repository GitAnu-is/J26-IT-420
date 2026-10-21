class RecommendCropInput {
  final double n;
  final double p;
  final double k;
  final double ph;
  final double rainfall;
  final double temperature;
  final double humidity;
  final String season;
  final String district;
  final String? farmId;

  RecommendCropInput({
    required this.n,
    required this.p,
    required this.k,
    required this.ph,
    required this.rainfall,
    required this.temperature,
    required this.humidity,
    required this.season,
    required this.district,
    this.farmId,
  });

  Map<String, dynamic> toJson() => {
    'nitrogen': n,
    'phosphorus': p,
    'potassium': k,
    'N': n,
    'P': p,
    'K': k,
    'ph': ph,
    'soilMoisture': humidity,
    'rainfall': rainfall,
    'temperature': temperature,
    'humidity': humidity,
    'season': season,
    'district': district,
    if (farmId != null) 'farmId': farmId,
  };
}

class RecommendCropResult {
  final String recommendedCrop;
  final double confidence;
  final Map<String, double> probabilities;
  final String? model;

  RecommendCropResult({
    required this.recommendedCrop,
    required this.confidence,
    this.probabilities = const {},
    this.model,
  });

  factory RecommendCropResult.fromJson(Map<String, dynamic> json) {
    Map<String, double> probs = {};
    if (json['probabilities'] is Map) {
      json['probabilities'].forEach((k, v) {
        if (v is num) probs[k.toString()] = v.toDouble();
      });
    }
    return RecommendCropResult(
      recommendedCrop: json['recommendedCrop'] ?? json['crop'] ?? 'BANANA',
      confidence: json['confidence'] != null ? (json['confidence'] as num).toDouble() : 0.85,
      probabilities: probs,
      model: json['model']?.toString(),
    );
  }
}

class PredictHarvestInput {
  final String crop;
  final DateTime referenceDate;
  final String? district;
  final String? season;
  final String? farmId;

  PredictHarvestInput({
    required this.crop,
    required this.referenceDate,
    this.district,
    this.season,
    this.farmId,
  });

  Map<String, dynamic> toJson() => {
    'crop': crop,
    'cropType': crop,
    'plantingDate': referenceDate.toIso8601String().split('T')[0],
    'referenceDate': referenceDate.toIso8601String().split('T')[0],
    if (district != null) 'district': district,
    if (season != null) 'season': season,
    if (farmId != null) 'farmId': farmId,
  };
}

class PredictHarvestResult {
  final String cropType;
  final String referenceEvent;
  final String referenceDate;
  final int predictedDurationDays;
  final String expectedHarvestDate;
  final String harvestWindowStart;
  final String harvestWindowEnd;
  final int windowDays;

  PredictHarvestResult({
    required this.cropType,
    required this.referenceEvent,
    required this.referenceDate,
    required this.predictedDurationDays,
    required this.expectedHarvestDate,
    required this.harvestWindowStart,
    required this.harvestWindowEnd,
    required this.windowDays,
  });

  factory PredictHarvestResult.fromJson(Map<String, dynamic> json) {
    return PredictHarvestResult(
      cropType: json['cropType'] ?? json['crop'] ?? 'BANANA',
      referenceEvent: json['referenceEvent'] ?? 'PLANTING',
      referenceDate: json['referenceDate'] ?? '',
      predictedDurationDays: json['predictedDurationDays'] ?? json['durationDays'] ?? 0,
      expectedHarvestDate: json['expectedHarvestDate'] ?? '',
      harvestWindowStart: json['harvestWindowStart'] ?? '',
      harvestWindowEnd: json['harvestWindowEnd'] ?? '',
      windowDays: json['windowDays'] ?? 14,
    );
  }
}

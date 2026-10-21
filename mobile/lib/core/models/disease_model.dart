import '../api/api_config.dart';

class DiseaseDetectionResult {
  final String id;
  final String diseaseName;
  final String? diseaseNameDisplay;
  final String? scientificName;
  final String cropType;
  final double confidence;
  final bool isHealthy;
  final String severityStatus;
  final String? severityLevel;
  final List<String> treatmentGuidance;
  final String? guidanceCitation;
  final String? gradcamUrl;
  final String? imageUrl;
  final String? base64Gradcam;
  final String? modelIdentifier;
  final String? modelVersion;

  DiseaseDetectionResult({
    required this.id,
    required this.diseaseName,
    this.diseaseNameDisplay,
    this.scientificName,
    required this.cropType,
    required this.confidence,
    required this.isHealthy,
    this.severityStatus = 'UNAVAILABLE',
    this.severityLevel,
    this.treatmentGuidance = const [],
    this.guidanceCitation,
    this.gradcamUrl,
    this.imageUrl,
    this.base64Gradcam,
    this.modelIdentifier,
    this.modelVersion,
  });

  String get displayName => diseaseNameDisplay ?? diseaseName;

  bool get hasGradcam =>
      (base64Gradcam != null && base64Gradcam!.isNotEmpty) ||
      (gradcamUrl != null && gradcamUrl!.isNotEmpty);

  String get fullGradcamUrl {
    if (gradcamUrl != null && gradcamUrl!.startsWith('http')) return gradcamUrl!;
    if (gradcamUrl != null && gradcamUrl!.isNotEmpty) {
      final path = gradcamUrl!.startsWith('/') ? gradcamUrl! : '/$gradcamUrl';
      if (path.startsWith('/api/v1/')) {
        return '${ApiConfig.rootOrigin}$path';
      }
      return '${ApiConfig.baseUrl}$path';
    }
    return '${ApiConfig.baseUrl}/diseases/assessments/$id/gradcam';
  }

  factory DiseaseDetectionResult.fromJson(Map<String, dynamic> json) {
    List<String> guidance = [];
    if (json['managementGuidance'] is List) {
      guidance = (json['managementGuidance'] as List).map((e) => e.toString()).toList();
    } else if (json['treatmentGuidance'] is List) {
      guidance = (json['treatmentGuidance'] as List).map((e) => e.toString()).toList();
    } else if (json['treatment'] is List) {
      guidance = (json['treatment'] as List).map((e) => e.toString()).toList();
    }

    final id = json['id'] ?? json['_id'] ?? json['assessmentId'] ?? json['savedAssessmentId'] ?? '';
    final isH = json['isHealthy'] ?? (json['diseaseName']?.toString().toLowerCase().contains('healthy') ?? false);

    final gradcamPath = json['gradcamUrl'] ??
        json['gradcamPath'] ??
        (json['gradCamArtifactReference'] != null ? '/api/v1/diseases/gradcam/${json['gradCamArtifactReference']}' : null) ??
        (json['gradcamArtifactReference'] != null ? '/api/v1/diseases/gradcam/${json['gradcamArtifactReference']}' : null);

    final rawConfidence = json['confidence'];
    double conf = 0.89;
    if (rawConfidence is num) {
      conf = rawConfidence.toDouble();
    } else if (rawConfidence is String) {
      conf = double.tryParse(rawConfidence) ?? 0.89;
    }

    return DiseaseDetectionResult(
      id: id.toString(),
      diseaseName: json['diseaseNameDisplay'] ?? json['predictedDisease'] ?? json['diseaseName'] ?? json['classification'] ?? 'Unknown',
      diseaseNameDisplay: json['diseaseNameDisplay'] ?? json['predictedDisease'],
      scientificName: json['scientificName'],
      cropType: (json['cropType'] ?? json['crop'] ?? 'BANANA').toString().toUpperCase(),
      confidence: conf,
      isHealthy: isH,
      severityStatus: (json['severityStatus'] ?? json['severity'] ?? 'UNAVAILABLE').toString(),
      severityLevel: json['severityLevel']?.toString(),
      treatmentGuidance: guidance,
      guidanceCitation: json['guidanceCitation']?.toString(),
      gradcamUrl: gradcamPath,
      imageUrl: json['imageUrl'] ?? json['imagePath'],
      base64Gradcam: json['gradcamHeatmapBase64'],
      modelIdentifier: json['modelIdentifier'] ?? json['modelMetadata']?['modelName'] ?? 'EfficientNet-B0',
      modelVersion: json['modelVersion'] ?? json['modelMetadata']?['modelVersion'] ?? 'v1.0',
    );
  }
}

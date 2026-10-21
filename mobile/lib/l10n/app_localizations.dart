import 'package:flutter/material.dart';
import 'translations_en.dart';
import 'translations_si.dart';
import 'translations_ta.dart';

class AppLocalizations extends ChangeNotifier {
  Locale _locale;

  AppLocalizations(this._locale);

  Locale get locale => _locale;

  void setLocale(Locale loc) {
    if (_locale != loc) {
      _locale = loc;
      notifyListeners();
    }
  }

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations) ??
        AppLocalizations(const Locale('en'));
  }

  static const List<Locale> supportedLocales = [
    Locale('en'),
    Locale('si'),
    Locale('ta'),
  ];

  static const LocalizationsDelegate<AppLocalizations> delegate = AppLocalizationsDelegate();

  Map<String, String> get _currentTranslations {
    switch (_locale.languageCode) {
      case 'si':
        return siTranslations;
      case 'ta':
        return taTranslations;
      case 'en':
      default:
        return enTranslations;
    }
  }

  String t(String key, [Map<String, String>? params]) {
    String value = _currentTranslations[key] ?? enTranslations[key] ?? key;
    if (params != null) {
      params.forEach((k, v) {
        value = value.replaceAll('{$k}', v);
      });
    }
    return value;
  }

  // Common UI getters
  String get appName => 'AgriGuard';
  String get loginTitle => t('login');
  String get cropBanana => _locale.languageCode == 'ta' ? 'வாழை' : (_locale.languageCode == 'si' ? 'කෙසෙල්' : t('cropBanana'));
  String get cropPineapple => _locale.languageCode == 'ta' ? 'அன்னாசி' : (_locale.languageCode == 'si' ? 'අන්නාසි' : t('cropPineapple'));
  String get cropBlackPepper => _locale.languageCode == 'ta' ? 'கருப்பு மிளகு' : (_locale.languageCode == 'si' ? 'ගම්මිරිස්' : t('cropPepper'));
  String get next => t('continueBtn');
  String get back => 'Back';
  String get cropType => t('cropType');
  String get fTransportTitle => 'Transport Route Risk Assessment';
  String get officialName => 'Agricultural Logistics Officer';
  String get fTransportOfficial => 'Route Vulnerability & Transit Safety Evaluator';
  String get previousChecks => 'Previous Assessments';
  String get packagingTitle => t('packagingTitle');
  String get roleOfficer => t('roleOfficer');
  String get roleTransport => t('roleTransport');
  String get roleFarmer => t('roleFarmer');
  String get settingsTitle => t('settingsTitle');
  String get language => 'Language';
  String get languageNote => 'Choose your preferred language for AgriGuard.';
  String get preferredLocation => 'Preferred Location';
  String get notifWeather => 'Weather Alerts';
  String get notifHarvest => 'Harvest Timing Alerts';
  String get notifDisease => 'Disease Surveillance Alerts';
  String get notifTransport => 'Transport Condition Alerts';
  String get logout => t('logout');
  String get appVersion => 'v1.0.0 (SLIIT J26-IT-420)';
  String get moreTitle => 'More Features & Management';
  String get historyTitle => t('historyTitle');
  String get notifTitle => t('notifTitle');
  String get fDiseaseTitle => t('fDiseaseTitle');
  String get fDiseaseOfficial => 'Foliar Pathology & Disease Identification Specialist';
  String get fHarvestTitle => 'Intelligent Harvest Timing & Maturity';
  String get fHarvestOfficial => 'Harvest Maturity & Phenology Specialist';
  String get markAllRead => 'Mark all as read';
  String get allowTitle => 'Enable Push Notifications';
  String get allowBody => 'Get timely real-time weather alerts, harvest window reminders, disease alerts, and route risk updates.';
  String get notNow => 'Not now';
  String get allow => 'Allow notifications';
  String get sevUrgent => 'Urgent';
  String get sevWarning => 'Warning';
  String get sevInfo => 'Notice';
  String get seeDetails => 'View Details';
  String get editRecord => 'Edit Field Record';
  String get addRecord => t('addRecord');
  String get plantingDate => t('plantingDate');
  String get expectedHarvest => t('expectedHarvest');
  String get soilPh => 'Soil pH (1 - 14)';
  String get navRecords => t('navRecords');
  String get retry => t('retry');
  String get noRecordsTitle => 'No Field Records Found';
  String get noRecordsBody => 'Create your first planting or harvest record to track crop cycles.';
  String get fCropTitle => 'Crop Suitability Recommendation';
  String get fCropOfficial => 'Agronomic Soil & Suitability Specialist';
  String get showCrops => 'Recommend Crops';
  String get cropResultsTitle => 'Optimal Crop Recommendations';
  String get hideGuide => 'Hide Cultivation Guide';
  String get viewGuide => 'View Cultivation Guide';

  // Plant Health getters matching Web UI
  String get checkMyPlant => t('checkMyPlant');
  String get selectCrop => t('selectCrop');
  String get addPhoto => t('addPhoto');
  String get takePhoto => t('takePhoto');
  String get fromGallery => t('fromGallery');
  String get useSample => t('useSample');
  String get retake => t('retake');
  String get leafAttached => t('leafAttached');
  String get photoTips => t('photoTips');
  String get tip1 => t('tip1');
  String get tip2 => t('tip2');
  String get tip3 => t('tip3');
  String get checkPlant => t('checkPlant');
  String get needPhoto => t('needPhoto');
  String get checkAnother => t('checkAnother');
  String get analyzingLeaf => t('analyzingLeaf');
  String get photoTab => t('photoTab');
  String get gradcamHeatmap => t('gradcamHeatmap');
  String get attentionActivation => t('attentionActivation');
  String get severityStatus => t('severityStatus');
  String get sevUnavailable => t('sevUnavailable');
  String get doaGuidance => t('doaGuidance');
  String get supportingReferences => t('supportingReferences');
}

class AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => ['en', 'si', 'ta'].contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) async => AppLocalizations(locale);

  @override
  bool shouldReload(AppLocalizationsDelegate old) => false;
}

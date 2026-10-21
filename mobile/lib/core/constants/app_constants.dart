class AppConstants {
  static const String appName = 'Agri Guard';
  static const String appVersion = 'v1.0.0 (SLIIT J26-IT-420)';

  // Supported crops strictly aligned with research scope
  static const String cropBanana = 'BANANA';
  static const String cropPineapple = 'PINEAPPLE';
  static const String cropBlackPepper = 'BLACK_PEPPER';

  static const List<String> supportedCrops = [
    cropBanana,
    cropPineapple,
    cropBlackPepper,
  ];

  // User Roles
  static const String roleFarmer = 'FARMER';
  static const String roleOfficer = 'AGRICULTURAL_OFFICER';
  static const String roleTransport = 'TRANSPORT_OPERATOR';

  // Sri Lankan Agricultural Districts
  static const List<String> districts = [
    'Kurunegala',
    'Gampaha',
    'Matale',
    'Kandy',
    'Kegalle',
    'Monaragala',
    'Anuradhapura',
    'Dambulla',
    'Colombo',
  ];

  // Seasons
  static const List<String> seasons = [
    'MAHA',
    'YALA',
  ];

  // Soil Types
  static const List<String> soilTypes = [
    'SANDY_LOAM',
    'CLAY_LOAM',
    'RED_YELLOW_PODZOLIC',
    'ALLUVIAL',
    'LATOSOLIC',
  ];

  // Transportation Vehicle Types
  static const List<String> vehicleTypes = [
    'COVERED_TRUCK',
    'REFRIGERATED_TRUCK',
    'OPEN_TRUCK',
    'PICKUP',
    'THREE_WHEELER',
    'TRACTOR_TRAILER',
  ];

  // Packaging Types
  static const List<String> packagingTypes = [
    'PLASTIC_CRATES',
    'CORRUGATED_BOXES',
    'WOODEN_CRATES',
    'POLYETHYLENE_LINED_BAGS',
    'GUNNY_BAGS',
    'JUTE_BAGS',
    'LOOSE_BULK',
  ];

  // Road Conditions
  static const List<String> roadConditions = [
    'PAVED_GOOD',
    'PAVED_POOR',
    'UNPAVED_ROUGH',
    'MIXED',
  ];
}

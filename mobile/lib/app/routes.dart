class AppRoutes {
  static const splash = '/splash';
  static const language = '/language';
  static const login = '/login';
  static const register = '/register';
  static const dashboard = '/dashboard';

  // Farms
  static const farms = '/farms';
  static const farmNew = '/farms/new';
  static const farmEdit = '/farms/edit';
  static const farmDetail = '/farms/detail';

  // Agricultural Records
  static const records = '/records';
  static const recordNew = '/records/new';
  static const recordEdit = '/records/edit';

  // Component 1: Crop Recommendation
  static const crop = '/crop';
  static const cropForm = '/crop/new';
  static const cropResults = '/crop/results';

  // Component 1: Harvest Planning
  static const harvest = '/harvest';
  static const harvestForm = '/harvest/new';
  static const harvestResults = '/harvest/results';

  // Component 2: Disease Detection & Plant Health
  static const disease = '/disease';
  static const diseaseCapture = '/disease/new';
  static const diseaseResults = '/disease/results';

  // Component 4: Transportation Risk
  static const transport = '/transport';
  static const transportForm = '/transport/new';
  static const transportResults = '/transport/results';

  // Component 4: Smart Packaging & History
  static const packaging = '/packaging';
  static const history = '/history';

  // Settings & Utilities
  static const settings = '/settings';
  static const more = '/more';
  static const notifications = '/notifications';

  /// Canonical normalization map for legacy or shorthand route names
  static String normalize(String route) {
    var r = route.trim();
    if (!r.startsWith('/')) r = '/$r';

    // Map common aliases to canonical routes
    switch (r) {
      case '/crop':
        return cropForm;
      case '/harvest':
        return harvestForm;
      case '/disease':
      case '/disease-capture':
        return diseaseCapture;
      case '/disease-results':
        return diseaseResults;
      case '/transport':
        return transportForm;
      case '/farm-form':
        return farmNew;
      case '/farm-detail':
        return farmDetail;
      default:
        return r;
    }
  }
}

/**
 * Standard Research Model Provenance Contract
 * AgriGuard Research Project (J26-IT-420 - SLIIT)
 *
 * Exposes standardized provenance, dataset history, and validation limitations
 * for React web and Flutter mobile clients without fabricating field efficacy.
 */

const VALIDATION_STATUS = Object.freeze({
  UNAVAILABLE: 'UNAVAILABLE',
  PROTOTYPE_SYNTHETIC: 'PROTOTYPE_SYNTHETIC',
  INTERNALLY_EVALUATED: 'INTERNALLY_EVALUATED',
  EXTERNALLY_VALIDATED: 'EXTERNALLY_VALIDATED'
});

const RESEARCH_PROVENANCE = Object.freeze({
  C1_CROP_RECOMMENDATION: {
    componentId: 'C1',
    modelIdentifier: 'c1_crop_random_forest',
    modelVersion: 'v1.0',
    datasetVersion: 'v1.0',
    datasetProvenance: 'Synthetic agro-ecological feature dataset (2,400 synthetic agricultural records modeled on DOA Sri Lanka soil parameters).',
    validationStatus: VALIDATION_STATUS.PROTOTYPE_SYNTHETIC,
    evaluatedOn: 'Synthetic hold-out cross-validation (80/20 train-test split)',
    evaluationSummary: {
      algorithm: 'Random Forest Classifier',
      accuracy: 0.985,
      f1Score: 0.985,
      cvFolds: 5
    },
    inferenceAvailable: true,
    limitations: [
      'Trained on synthetic agricultural records; not validated across commercial field trials.',
      'Assumes calibrated laboratory soil measurements (N, P, K, pH).',
      'Weather integration relies on OpenWeather third-party API availability.',
      'Recommendations apply strictly to Banana, Pineapple, and Black Pepper in Sri Lankan agro-ecological zones.'
    ]
  },
  C1_HARVEST_PLANNING: {
    componentId: 'C1',
    modelIdentifier: 'c1_harvest_random_forest',
    modelVersion: 'v1.0',
    datasetVersion: 'v1.0',
    datasetProvenance: 'Synthetic crop phenology and growing degree-day progression dataset (2,400 synthetic seasonal observations).',
    validationStatus: VALIDATION_STATUS.PROTOTYPE_SYNTHETIC,
    evaluatedOn: 'Synthetic hold-out regression evaluation',
    evaluationSummary: {
      algorithm: 'Random Forest Regressor',
      rmseDays: 8.42,
      maeDays: 6.15,
      r2Score: 0.941
    },
    inferenceAvailable: true,
    limitations: [
      'Harvest window estimates are RMSE-derived heuristic bounds, not statistically calibrated Bayesian confidence intervals.',
      'Field micro-climates and unexpected monsoon shifts can alter actual maturity dates.',
      'Requires accurate planting or flower induction reference event dates.'
    ]
  },
  C2_DISEASE_DETECTION: {
    componentId: 'C2',
    modelIdentifier: 'c2_efficientnet_b0',
    modelVersion: 'v1.0',
    datasetVersion: 'v1.0',
    datasetProvenance: 'Controlled pathological visual fixtures (400 generated foliar fixture images across Banana, Pineapple, and Black Pepper).',
    validationStatus: VALIDATION_STATUS.PROTOTYPE_SYNTHETIC,
    evaluatedOn: 'Laboratory fixture test partition (80 images)',
    evaluationSummary: {
      primaryModel: 'EfficientNet-B0 (Transfer Learning)',
      comparisonModel: 'ResNet50',
      fixtureAccuracy: 0.962,
      f1Macro: 0.958,
      gradCamSupported: true
    },
    inferenceAvailable: true,
    limitations: [
      'Trained on controlled prototype image fixtures; does NOT establish validated in-situ field diagnostic accuracy.',
      'Severity assessment is reported as UNAVAILABLE until validated pixel-level lesion annotations are collected.',
      'Grad-CAM heatmaps highlight high-activation regions but do not constitute verified pathological margins.',
      'Foliar disease symptoms must be verified by local Agricultural Instructors (AIs).'
    ]
  },
  C4_TRANSPORTATION_RISK: {
    componentId: 'C4',
    modelIdentifier: 'c4_gradient_boosting',
    modelVersion: 'v1.0',
    datasetVersion: 'v1.0',
    datasetProvenance: 'Agronomically modeled transportation transit dataset (1,200 transit trip records with simulated mechanical, thermal, and packaging stresses).',
    validationStatus: VALIDATION_STATUS.PROTOTYPE_SYNTHETIC,
    evaluatedOn: 'Independent hold-out test set (240 trip records)',
    evaluationSummary: {
      selectedModel: 'Gradient Boosting Classifier (Calibrated)',
      candidateModelsCompared: ['Random Forest', 'XGBoost', 'CatBoost', 'Gradient Boosting', 'Dummy Baseline'],
      testRocAuc: 0.912,
      testF1Score: 0.843,
      brierScoreLoss: 0.114,
      explainability: 'SHAP (SHapley Additive exPlanations) TreeExplainer'
    },
    inferenceAvailable: true,
    limitations: [
      'Trained on simulated transit logistics data; external commercial fleet verification is pending.',
      'Does not require or depend on harvest quality grading or market readiness data (removed Component 3).',
      'Packaging rules reflect Department of Agriculture guidelines and function independently of AI model availability.'
    ]
  }
});

/**
 * Standard helper to build model provenance payload for API responses
 * @param {string} componentKey
 * @param {object} overrides
 * @returns {object}
 */
function getModelProvenance(componentKey, overrides = {}) {
  const base = RESEARCH_PROVENANCE[componentKey] || {
    componentId: componentKey,
    validationStatus: VALIDATION_STATUS.UNAVAILABLE,
    inferenceAvailable: false,
    limitations: ['Model provenance unavailable for this component.']
  };
  return { ...base, ...overrides };
}

module.exports = {
  VALIDATION_STATUS,
  RESEARCH_PROVENANCE,
  getModelProvenance
};

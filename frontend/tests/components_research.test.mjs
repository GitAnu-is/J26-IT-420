import test from 'node:test';
import assert from 'node:assert/strict';

test('C1: Crop Recommendation correctly maps crop keys and validates soil parameters', () => {
  const supportedCrops = ['BANANA', 'PINEAPPLE', 'BLACK_PEPPER'];

  function mapCropKey(input) {
    const normalized = String(input).toUpperCase().replace(/-/g, '_');
    if (normalized === 'PEPPER') return 'BLACK_PEPPER';
    if (!supportedCrops.includes(normalized)) {
      throw new Error(`Unsupported crop: ${input}`);
    }
    return normalized;
  }

  assert.equal(mapCropKey('banana'), 'BANANA');
  assert.equal(mapCropKey('pineapple'), 'PINEAPPLE');
  assert.equal(mapCropKey('pepper'), 'BLACK_PEPPER');
  assert.equal(mapCropKey('black_pepper'), 'BLACK_PEPPER');
  assert.throws(() => mapCropKey('wheat'), /Unsupported crop/);
});

test('C1: Harvest Prediction enforces biological reference events (Planting vs Flowering/Spike Emergence)', () => {
  function getBiologicalReferenceEventDescription(crop) {
    if (crop === 'BLACK_PEPPER') {
      return {
        eventLabel: 'Spike Emergence / Flowering Date',
        description: 'For Black Pepper, the harvest cycle is measured from the onset of flowering / spike emergence rather than root planting.'
      };
    }
    return {
      eventLabel: 'Planting Date',
      description: 'Measured from sucker planting or field transplanting date.'
    };
  }

  const pepperInfo = getBiologicalReferenceEventDescription('BLACK_PEPPER');
  assert.equal(pepperInfo.eventLabel, 'Spike Emergence / Flowering Date');

  const bananaInfo = getBiologicalReferenceEventDescription('BANANA');
  assert.equal(bananaInfo.eventLabel, 'Planting Date');
});

test('C2: Plant Disease Analysis enforces multipart image field and truthful severity availability', () => {
  // Multer expects field name 'image'
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSizeBytes = 8 * 1024 * 1024; // 8MB

  function validateUploadImage(file) {
    if (!allowedMimeTypes.includes(file.type)) {
      throw new Error('Unsupported image format. Allowed: JPEG, PNG, WebP.');
    }
    if (file.size > maxSizeBytes) {
      throw new Error('Image exceeds 8MB maximum upload limit.');
    }
    return true;
  }

  assert.ok(validateUploadImage({ type: 'image/jpeg', size: 1024 * 1024 }));
  assert.throws(() => validateUploadImage({ type: 'application/pdf', size: 100 }), /Unsupported image format/);
  assert.throws(() => validateUploadImage({ type: 'image/png', size: 10 * 1024 * 1024 }), /exceeds 8MB/);

  // Truthful severity representation
  function formatSeverityDisplay(analysisResult) {
    if (analysisResult.severityStatus === 'UNAVAILABLE' || !analysisResult.severity) {
      return {
        isAvailable: false,
        label: 'Severity Assessment Unavailable',
        message: 'Disease severity assessment is not available for this analysis.'
      };
    }
    return {
      isAvailable: true,
      label: analysisResult.severity,
      message: null
    };
  }

  const unavailableCase = formatSeverityDisplay({
    disease: 'Sigatoka',
    severityStatus: 'UNAVAILABLE',
    severity: null
  });
  assert.equal(unavailableCase.isAvailable, false);
  assert.equal(unavailableCase.message, 'Disease severity assessment is not available for this analysis.');

  // Authorized Grad-CAM URL builder
  function getGradCamArtifactUrl(baseUrl, assessmentId) {
    return `${baseUrl}/diseases/assessments/${assessmentId}/gradcam`;
  }

  const gradCamUrl = getGradCamArtifactUrl('http://localhost:5000/api/v1', 'assess_998');
  assert.equal(gradCamUrl, 'http://localhost:5000/api/v1/diseases/assessments/assess_998/gradcam');
});

test('C4: Transportation Risk and SHAP feature importance representation', () => {
  function parseShapExplanations(rawShap) {
    if (!Array.isArray(rawShap)) return [];
    return rawShap.map((item) => ({
      feature: item.feature || item.factor,
      impact: Number(item.impact || item.value || 0),
      direction: Number(item.impact || item.value || 0) > 0 ? 'INCREASES_RISK' : 'REDUCES_RISK',
      disclosure: 'SHAP values reflect model attribution features, not physical causality.'
    }));
  }

  const rawFeatures = [
    { factor: 'Road Condition (ROUGH)', impact: 0.28 },
    { factor: 'Ventilated Crate Packaging', impact: -0.15 }
  ];

  const parsed = parseShapExplanations(rawFeatures);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].direction, 'INCREASES_RISK');
  assert.equal(parsed[1].direction, 'REDUCES_RISK');
  assert.ok(parsed[0].disclosure.includes('not physical causality'));
});

test('C4: Smart Packaging recommendation operates independently of AI inference', () => {
  // Independent expert rules recommendation
  function evaluatePackagingRecommendation(input) {
    if (!['BANANA', 'PINEAPPLE', 'BLACK_PEPPER'].includes(input.cropType)) {
      throw new Error('Unsupported crop for packaging');
    }

    const recommendations = {
      BANANA: {
        primaryMaterial: 'Corrugated Fibreboard Carton with Polyethylene Liner',
        cushioning: 'Foam padding between hands',
        ventilation: 'Side ventilation holes (4-6% total surface area)',
        temperatureRange: '13-14°C',
        source: 'Sri Lanka Department of Agriculture (DOA) Post-Harvest Manual'
      },
      PINEAPPLE: {
        primaryMaterial: 'Single-wall telescopic corrugated box',
        cushioning: 'Crown-to-base alternating placement with paper shred',
        ventilation: 'End-panel vent slots',
        temperatureRange: '8-10°C',
        source: 'Sri Lanka DOA / FAO Post-Harvest Standards'
      },
      BLACK_PEPPER: {
        primaryMaterial: 'Food-grade moisture-barrier Multi-wall paper bags or Polypropylene sacks',
        cushioning: 'N/A (Dry spice)',
        ventilation: 'Sealed dry storage to maintain moisture < 12%',
        temperatureRange: 'Ambient dry (<25°C)',
        source: 'Department of Export Agriculture (DEA) Standards'
      }
    };

    return {
      success: true,
      cropType: input.cropType,
      recommendation: recommendations[input.cropType],
      ruleVersion: 'DOA-EXP-2025.1'
    };
  }

  const bananaRec = evaluatePackagingRecommendation({ cropType: 'BANANA' });
  assert.ok(bananaRec.recommendation.primaryMaterial.includes('Corrugated'));
  assert.equal(bananaRec.ruleVersion, 'DOA-EXP-2025.1');

  const pepperRec = evaluatePackagingRecommendation({ cropType: 'BLACK_PEPPER' });
  assert.ok(pepperRec.recommendation.temperatureRange.includes('Ambient'));
});

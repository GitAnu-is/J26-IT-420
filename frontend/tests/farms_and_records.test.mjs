import test from 'node:test';
import assert from 'node:assert/strict';

test('Farms: Formats create payload and validates required fields', () => {
  function prepareCreateFarmInput(form) {
    if (!form.farmName?.trim()) throw new Error('Farm name is required');
    if (!form.district?.trim()) throw new Error('District is required');

    return {
      farmName: form.farmName.trim(),
      district: form.district.trim(),
      agroEcologicalZone: form.agroEcologicalZone?.trim() || undefined,
      location: {
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        address: form.address?.trim() || undefined
      },
      soilType: form.soilType || 'SANDY_LOAM',
      area: form.area ? Number(form.area) : undefined,
      areaUnit: form.areaUnit || 'ACRES',
      supportedCrops: Array.isArray(form.supportedCrops) ? form.supportedCrops : []
    };
  }

  const payload = prepareCreateFarmInput({
    farmName: ' Anuradhapura Model Farm ',
    district: 'Anuradhapura',
    agroEcologicalZone: 'DL1b',
    latitude: 8.3114,
    longitude: 80.4037,
    soilType: 'RED_YELLOW_PODZOLIC',
    area: '12.5',
    supportedCrops: ['BANANA', 'BLACK_PEPPER']
  });

  assert.equal(payload.farmName, 'Anuradhapura Model Farm');
  assert.equal(payload.area, 12.5);
  assert.equal(payload.areaUnit, 'ACRES');
  assert.deepEqual(payload.supportedCrops, ['BANANA', 'BLACK_PEPPER']);

  assert.throws(() => prepareCreateFarmInput({ district: 'Kandy' }), /Farm name is required/);
  assert.throws(() => prepareCreateFarmInput({ farmName: 'Test' }), /District is required/);
});

test('Records: Formats agricultural record payload with soil chemistry metrics', () => {
  function prepareCreateRecordInput(form) {
    if (!form.farmId?.trim()) throw new Error('Farm ID is required');
    if (!form.cropType?.trim()) throw new Error('Crop type is required');

    return {
      farmId: form.farmId.trim(),
      cropType: form.cropType,
      plantingDate: form.plantingDate || new Date().toISOString(),
      expectedHarvestDate: form.expectedHarvestDate || undefined,
      soilParameters: {
        nitrogen: form.nitrogen ? Number(form.nitrogen) : undefined,
        phosphorus: form.phosphorus ? Number(form.phosphorus) : undefined,
        potassium: form.potassium ? Number(form.potassium) : undefined,
        pH: form.ph ? Number(form.ph) : undefined,
        soilMoisture: form.soilMoisture ? Number(form.soilMoisture) : undefined
      },
      notes: form.notes?.trim() || undefined
    };
  }

  const payload = prepareCreateRecordInput({
    farmId: 'farm_abc123',
    cropType: 'BANANA',
    plantingDate: '2026-03-15T00:00:00.000Z',
    expectedHarvestDate: '2026-12-15T00:00:00.000Z',
    nitrogen: 120,
    phosphorus: 45,
    potassium: 150,
    ph: 6.5,
    soilMoisture: 32.4,
    notes: 'Primary Cavendish plantation block A'
  });

  assert.equal(payload.farmId, 'farm_abc123');
  assert.equal(payload.cropType, 'BANANA');
  assert.equal(payload.soilParameters.pH, 6.5);
  assert.equal(payload.soilParameters.soilMoisture, 32.4);
});

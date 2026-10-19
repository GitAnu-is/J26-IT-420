import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

function extractKeysFromTsFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Extract all property keys inside the object: "keyName: 'value'" or "keyName: {"
  const matches = [...content.matchAll(/^\s*([a-zA-Z0-9_]+)\s*:/gm)];
  return matches.map(m => m[1]);
}

test('Navigation: Preserves required navigation items and excludes removed Component 3', () => {
  const navContent = fs.readFileSync(path.join(srcDir, 'data/webNav.ts'), 'utf8');

  // Verify navigation screens
  const screenMatches = [...navContent.matchAll(/screen:\s*'([^']+)'/g)].map(m => m[1]);
  assert.ok(screenMatches.length >= 10, 'Expected at least 10 navigation items');

  const expectedScreens = [
    'home',
    'farms',
    'records',
    'crop-form',
    'harvest-form',
    'disease-capture',
    'transport-form',
    'packaging',
    'history',
    'settings'
  ];

  for (const screen of expectedScreens) {
    assert.ok(screenMatches.includes(screen), `Must include ${screen} in web navigation`);
  }

  // Verify Component 3 was NOT introduced
  for (const id of screenMatches) {
    assert.ok(!id.toLowerCase().includes('quality'), 'Must not have quality grading');
    assert.ok(!id.toLowerCase().includes('grading'), 'Must not have grading');
    assert.ok(!id.toLowerCase().includes('market'), 'Must not have market readiness');
  }
});

test('i18n: Complete translation parity across English, Sinhala, and Tamil', () => {
  const enKeys = extractKeysFromTsFile(path.join(srcDir, 'data/translations/en.ts'));
  const siKeys = extractKeysFromTsFile(path.join(srcDir, 'data/translations/si.ts'));
  const taKeys = extractKeysFromTsFile(path.join(srcDir, 'data/translations/ta.ts'));

  assert.equal(enKeys.length, siKeys.length, `Key count mismatch between en (${enKeys.length}) and si (${siKeys.length})`);
  assert.equal(enKeys.length, taKeys.length, `Key count mismatch between en (${enKeys.length}) and ta (${taKeys.length})`);

  const siSet = new Set(siKeys);
  const taSet = new Set(taKeys);

  for (const key of enKeys) {
    assert.ok(siSet.has(key), `Missing Sinhala translation for key "${key}"`);
    assert.ok(taSet.has(key), `Missing Tamil translation for key "${key}"`);
  }

  // Check critical research keys are present
  const requiredKeys = [
    'sevUnavailable',
    'prototypeNotice',
    'soilMoisture',
    'navFarms',
    'navRecords',
    'navPackaging',
    'packagingTitle',
    'packagingMaterial',
    'handlingAdvice',
    'storageAdvice',
    'transportPrecautions'
  ];

  for (const key of requiredKeys) {
    assert.ok(enKeys.includes(key), `Expected English to contain "${key}"`);
    assert.ok(siSet.has(key), `Expected Sinhala to contain "${key}"`);
    assert.ok(taSet.has(key), `Expected Tamil to contain "${key}"`);
  }
});

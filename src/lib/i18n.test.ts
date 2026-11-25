import test from 'node:test';
import assert from 'node:assert/strict';
import { t, TRANSLATIONS } from './i18n';

test('English and Hausa translation dictionaries maintain complete key parity', () => {
  const enKeys = Object.keys(TRANSLATIONS.en).sort();
  const haKeys = Object.keys(TRANSLATIONS.ha).sort();
  assert.deepEqual(enKeys, haKeys);

  for (const key of enKeys) {
    const typedKey = key as keyof typeof TRANSLATIONS.en;
    assert.ok(t('en', typedKey).trim().length > 0);
    assert.ok(t('ha', typedKey).trim().length > 0);
  }
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { defaultKeyRatings, parseKeyRatings } from './key-ratings.ts';
import { FLAT_KEYS } from './keys.ts';

describe('parseKeyRatings', () => {
  it('reads ratings in the stored format', () => {
    const stored = { keys: FLAT_KEYS.map((key, i) => ({ key, rating: (i % 5) + 1 })) };
    assert.deepEqual(parseKeyRatings(JSON.stringify(stored)), stored);
  });

  it('falls back to rating 1 for every key on missing or broken data', () => {
    const defaults = defaultKeyRatings();
    assert.ok(defaults.keys.every((k) => k.rating === 1));
    assert.deepEqual(parseKeyRatings(null), defaults);
    assert.deepEqual(parseKeyRatings('not json'), defaults);
    assert.deepEqual(parseKeyRatings('{"keys":[]}'), defaults);
    const badRating = { keys: FLAT_KEYS.map((key) => ({ key, rating: 7 })) };
    assert.deepEqual(parseKeyRatings(JSON.stringify(badRating)), defaults);
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ChordSequence } from './chord-sequence.ts';
import type { KeyRatings, Rating } from './key-ratings.ts';
import { FLAT_KEYS, type Key } from './keys.ts';
import { chordToText, type Bar } from './progression.ts';
import { seededRandom } from './random.ts';

function ratings(rating: (key: Key) => Rating): KeyRatings {
  return { keys: FLAT_KEYS.map((key) => ({ key, rating: rating(key) })) };
}

function text(bars: Bar[]): string[] {
  return bars.map((bar) => bar.chords.map(chordToText).join(' – '));
}

describe('ChordSequence', () => {
  it('goes up a fourth from C, one progression after the other', () => {
    const sequence = new ChordSequence({ progression: 'iim*7* - V*7* | I*maj7*', keyOrder: '5' });
    const bars = sequence.take(6);
    assert.deepEqual(
      bars.map((bar) => bar.key),
      ['C', 'C', 'F', 'F', 'Bb', 'Bb'],
    );
    assert.deepEqual(text(bars), ['Dm7 – G7', 'Cmaj7', 'Gm7 – C7', 'Fmaj7', 'Cm7 – F7', 'Bbmaj7']);
  });

  it('goes down a fourth from C', () => {
    const sequence = new ChordSequence({ progression: 'I*maj7*', keyOrder: '-5' });
    assert.deepEqual(
      sequence.take(4).map((bar) => bar.key),
      ['C', 'G', 'D', 'A'],
    );
  });

  for (const keyOrder of ['R', 'WC', '5', '-5'] as const) {
    it(`never repeats a key in key order ${keyOrder}`, () => {
      const sequence = new ChordSequence(
        { progression: 'I*maj7*', keyOrder, keyRatings: ratings((key) => (key === 'F' ? 1 : 5)) },
        seededRandom(3),
      );
      const keys = sequence.take(500).map((bar) => bar.key);
      assert.ok(keys.every((key, i) => key !== keys[i - 1]));
    });
  }

  it('brings up keys with a low rating more often in random order', () => {
    const sequence = new ChordSequence(
      { progression: 'I*maj7*', keyOrder: 'R', keyRatings: ratings((key) => (key === 'Gb' ? 1 : 5)) },
      seededRandom(1),
    );
    const keys = sequence.take(3000).map((bar) => bar.key);
    const gb = keys.filter((key) => key === 'Gb').length;
    const c = keys.filter((key) => key === 'C').length;
    assert.ok(gb > 3 * c, `Gb ${gb} times, C ${c} times`);
  });

  it('ignores the ratings when the keys are not weighted', () => {
    const sequence = new ChordSequence(
      { progression: 'I*maj7*', keyOrder: 'WC', weightKeys: false, keyRatings: ratings(() => 5) },
      seededRandom(5),
    );
    // Every cycle has all twelve keys
    assert.equal(new Set(sequence.take(12).map((bar) => bar.key)).size, 12);
  });

  it('plays a key with rating r in every r-th weighted cycle', () => {
    const sequence = new ChordSequence(
      { progression: 'I*maj7*', keyOrder: 'WC', keyRatings: ratings((key) => (key === 'C' || key === 'D' ? 1 : 2)) },
      seededRandom(9),
    );
    // Cycle 1 has C and D, cycle 2 has all twelve keys
    const keys = sequence.take(14).map((bar) => bar.key);
    assert.deepEqual(new Set(keys.slice(0, 2)), new Set(['C', 'D']));
    assert.deepEqual(new Set(keys.slice(2)), new Set(FLAT_KEYS));
  });

  it('is repeatable with a seeded random', () => {
    const take = () =>
      text(new ChordSequence({ progression: 'I*maj7* || Im*7*', keyOrder: 'R' }, seededRandom(42)).take(20));
    assert.deepEqual(take(), take());
  });

  it('starts over after reset, without the rest of the last progression', () => {
    const sequence = new ChordSequence({ progression: 'iim*7* - V*7* | I*maj7*', keyOrder: '5' });
    sequence.next();
    sequence.reset();
    assert.deepEqual(text([sequence.next()]), ['Dm7 – G7']);
  });

  it('hands out all bars of a key at once', () => {
    const sequence = new ChordSequence({ progression: 'iim*7* - V*7* | I*maj7*', keyOrder: '5' });
    assert.deepEqual(text(sequence.nextProgression()), ['Dm7 – G7', 'Cmaj7']);
    sequence.next();
    assert.deepEqual(text(sequence.nextProgression()), ['Fmaj7']);
    assert.deepEqual(text(sequence.nextProgression()), ['Cm7 – F7', 'Bbmaj7']);
  });

  it('uses the defaults for options set to undefined', () => {
    const sequence = new ChordSequence({
      progression: 'I*maj7*',
      keyOrder: 'R',
      keyRatings: undefined,
      weightKeys: undefined,
    });
    sequence.configure({ keyRatings: undefined });
    assert.equal(sequence.take(20).length, 20);
  });

  it('finishes the started progression before a new one takes over', () => {
    const sequence = new ChordSequence({ progression: 'iim*7* - V*7* | I*maj7*', keyOrder: '5' });
    sequence.next();
    sequence.configure({ progression: 'I*7*' });
    assert.deepEqual(text(sequence.take(2)), ['Cmaj7', 'F7']);
  });
});

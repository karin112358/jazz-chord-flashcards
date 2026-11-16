import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { chordToHtml, chordToText, progressionInKey, resolveNumerals, type Bar } from './progression.ts';
import { seededRandom } from './random.ts';

/** The bars as text, chords separated by ' – ', for compact expectations. */
function text(bars: Bar[]): string[] {
  return bars.map((bar) => bar.chords.map(chordToText).join(' – '));
}

describe('progressionInKey', () => {
  it('turns the numerals into the chords of the key', () => {
    assert.deepEqual(text(progressionInKey('iim*7* - V*7* | I*maj7*', 'C')), ['Dm7 – G7', 'Cmaj7']);
    assert.deepEqual(text(progressionInKey('iim*7* - V*7* | I*maj7*', 'Bb')), ['Cm7 – F7', 'Bbmaj7']);
  });

  it('spells the chords of G, D, A, E and B with sharps, all other keys with flats', () => {
    assert.deepEqual(text(progressionInKey('III*7*', 'E')), ['G#7']);
    assert.deepEqual(text(progressionInKey('III*7*', 'Ab')), ['C7']);
    assert.deepEqual(text(progressionInKey('VII*7*', 'Db')), ['C7']);
    assert.deepEqual(text(progressionInKey('IIIb*maj7*', 'D')), ['Fmaj7']);
  });

  it('lowers a numeral with a trailing b by a half step', () => {
    assert.deepEqual(text(progressionInKey('IV*7* - VIIb*7* | I*maj7*', 'C')), ['F7 – Bb7', 'Cmaj7']);
  });

  it('keeps the chord type between asterisks as written', () => {
    assert.deepEqual(text(progressionInKey('viim*7(b5)* - III*7* | vim*7*', 'C')), ['Bm7(b5) – E7', 'Am7']);
    assert.deepEqual(text(progressionInKey('vii*dim7*', 'C')), ['Bdim7']);
  });

  it('does not split a chord at a dash between asterisks', () => {
    assert.deepEqual(text(progressionInKey('iim*-7* - V*7*', 'C')), ['Dm-7 – G7']);
  });

  it('marks the chord type as superscript and knows the root', () => {
    const [bar] = progressionInKey('iim*7(b5)*', 'Gb');
    assert.equal(bar.key, 'Gb');
    assert.deepEqual(bar.chords, [
      {
        root: 'Ab',
        parts: [
          { text: 'Abm', superscript: false },
          { text: '7(b5)', superscript: true },
        ],
      },
    ]);
  });

  it('leaves out empty chords and bars, but always returns one bar', () => {
    assert.deepEqual(text(progressionInKey('I*maj7* - | | V*7*', 'C')), ['Cmaj7', 'G7']);
    assert.deepEqual(progressionInKey('  ', 'C'), [{ key: 'C', chords: [] }]);
  });

  it('gives a chord that does not start with a note no root', () => {
    const [bar] = progressionInKey('N.C. - *7*', 'C');
    assert.deepEqual(
      bar.chords.map((chord) => chord.root),
      [null, null],
    );
  });

  it('picks one of the alternatives, from an array or separated by ||', () => {
    const random = seededRandom(7);
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      seen.add(text(progressionInKey('I*maj7* || Im*7* || I*7*', 'C', random)).join(' | '));
      seen.add(text(progressionInKey(['I*maj7*', 'Im*7*'], 'F', random)).join(' | '));
    }
    assert.deepEqual([...seen].sort(), ['C7', 'Cm7', 'Cmaj7', 'Fm7', 'Fmaj7']);
  });
});

describe('resolveNumerals', () => {
  it('reads VII as one numeral, not V + II', () => {
    assert.equal(resolveNumerals('VII vii VI IV', 'C'), 'B B A F');
  });
});

describe('chordToHtml', () => {
  it('puts the chord type in <sup> and escapes the text', () => {
    const [bar] = progressionInKey('I*<b>* - <u>V', 'C');
    assert.deepEqual(bar.chords.map(chordToHtml), ['C<sup>&lt;b&gt;</sup>', '&lt;u&gt;G']);
  });
});

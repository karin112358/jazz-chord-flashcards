import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { bassLine } from './bass-line.ts';
import { progressionInKey } from './progression.ts';

describe('bassLine', () => {
  const bar = (progression: string) => progressionInKey(progression, 'C')[0];

  it('holds one chord for the whole bar', () => {
    assert.deepEqual(bassLine(bar('I*maj7*')), { roots: ['C', 'C', 'C', 'C'], walking: false });
  });

  it('gives two chords two beats each', () => {
    assert.deepEqual(bassLine(bar('iim*7* - V*7*')), { roots: ['D', 'D', 'G', 'G'], walking: false });
  });

  it('walks with three or four chords', () => {
    assert.deepEqual(bassLine(bar('iim*7* - V*7* - I*maj7*')), { roots: ['D', 'G', 'C', 'C'], walking: true });
    assert.deepEqual(bassLine(bar('I*maj7* - vim*7* - iim*7* - V*7*')), {
      roots: ['C', 'A', 'D', 'G'],
      walking: true,
    });
  });

  it('stays silent with more than four chords and on chords without a root', () => {
    assert.deepEqual(bassLine(bar('I - II - III - IV - V')).roots, [null, null, null, null]);
    assert.deepEqual(bassLine(bar('N.C.')).roots, [null, null, null, null]);
  });
});

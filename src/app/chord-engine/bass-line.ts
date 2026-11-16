import type { Bar } from './progression.ts';

/** The bass notes of a bar, one per beat; null means no note on that beat. */
export interface BassLine {
  roots: [string | null, string | null, string | null, string | null];
  /** True when every beat gets its own note; otherwise only beats 1 and 3 are played. */
  walking: boolean;
}

/**
 * The roots of the chords spread over the four beats:
 * one chord on all beats, two chords two beats each, three or four chords walk one per beat
 * (the third chord of three gets the last two beats). A bar with more chords stays silent.
 */
export function bassLine(bar: Bar): BassLine {
  const r = (index: number) => bar.chords[index]?.root ?? null;
  switch (bar.chords.length) {
    case 1:
      return { roots: [r(0), r(0), r(0), r(0)], walking: false };
    case 2:
      return { roots: [r(0), r(0), r(1), r(1)], walking: false };
    case 3:
      return { roots: [r(0), r(1), r(2), r(2)], walking: true };
    case 4:
      return { roots: [r(0), r(1), r(2), r(3)], walking: true };
    default:
      return { roots: [null, null, null, null], walking: false };
  }
}

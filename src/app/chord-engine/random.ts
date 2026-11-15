/** A source of random numbers in [0, 1), like Math.random. */
export type Random = () => number;

/**
 * A repeatable random number generator (mulberry32): the same seed always gives the same numbers.
 * Tests use it, and so does anything that has to produce the same sequence twice.
 */
export function seededRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One element of a non-empty array, picked at random. */
export function pick<T>(items: readonly T[], random: Random): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) {
    throw new RangeError('Cannot pick from an empty list');
  }
  return item;
}

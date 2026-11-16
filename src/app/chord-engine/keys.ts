/** The twelve keys, spelled with flats, starting on C. A key is always named in this spelling. */
export const FLAT_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

/** The same twelve notes spelled with sharps, used for the chords of the keys in SHARP_SPELLED_KEYS. */
export const SHARP_KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export type Key = (typeof FLAT_KEYS)[number];

/** Chords in these keys are spelled with sharps, in all other keys with flats. */
export const SHARP_SPELLED_KEYS: readonly Key[] = ['G', 'D', 'A', 'E', 'B'];

export function isKey(value: string): value is Key {
  return (FLAT_KEYS as readonly string[]).includes(value);
}

/** Half steps from C, 0 to 11. */
export function keyIndex(key: Key): number {
  return FLAT_KEYS.indexOf(key);
}

/** The key a number of half steps above (or below, when negative) the given key. */
export function transposeKey(key: Key, halfSteps: number): Key {
  return noteAt(FLAT_KEYS, keyIndex(key) + halfSteps);
}

/** The note names used for the chords of a key: sharps in G, D, A, E and B, otherwise flats. */
export function spellingFor(key: Key): readonly string[] {
  return SHARP_SPELLED_KEYS.includes(key) ? SHARP_KEYS : FLAT_KEYS;
}

/** The note a number of half steps above (or below) the key, spelled as in that key's chords. */
export function noteInKey(key: Key, halfSteps: number): string {
  return noteAt(spellingFor(key), keyIndex(key) + halfSteps);
}

/** The note a number of half steps above C, in one of the spellings; any whole number works. */
function noteAt<T>(notes: readonly T[], halfSteps: number): T {
  const note = notes[((halfSteps % 12) + 12) % 12];
  if (note === undefined) {
    throw new RangeError(`Not a whole number of half steps: ${halfSteps}`);
  }
  return note;
}

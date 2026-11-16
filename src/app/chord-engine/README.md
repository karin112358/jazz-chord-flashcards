# Chord engine

Everything the app knows about keys, chord progressions and key orders, without Angular, the DOM or audio. `PlayerComponent` uses it to show the bars and `ToneService` plays the bass line it computes. Any other TypeScript code can use it as well, for example a tool that prints practice sheets.

```ts
import { ChordSequence, chordToText, bassLine } from './index.ts';

const sequence = new ChordSequence({ progression: 'iim*7* - V*7* | I*maj7*', keyOrder: '5' });
for (const bar of sequence.take(4)) {
  console.log(bar.key, bar.chords.map(chordToText).join(' – '), bassLine(bar).roots);
}
// C Dm7 – G7 [ 'D', 'D', 'G', 'G' ]
// C Cmaj7 [ 'C', 'C', 'C', 'C' ]
// F Gm7 – C7 [ 'G', 'G', 'C', 'C' ]
// F Fmaj7 [ 'F', 'F', 'F', 'F' ]
```

## Files

| File                | What it holds                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `keys.ts`           | The twelve keys (named with flats), sharp and flat spelling, transposing                      |
| `exercises.ts`      | The predefined exercises and the default custom progression                                   |
| `key-orders.ts`     | Random, Weighted Cycle and the perfect fourth orders                                          |
| `key-ratings.ts`    | Ratings 1–5 per key, in the format the app stores                                             |
| `progression.ts`    | Parses a progression and puts it into a key: `progressionInKey`, `chordToText`, `chordToHtml` |
| `chord-sequence.ts` | `ChordSequence`: the endless stream of bars, one key after the other                          |
| `bass-line.ts`      | The bass note for each beat of a bar                                                          |
| `random.ts`         | A seeded random number generator for repeatable results                                       |

## Progression syntax

The same syntax as on the documentation page under "Custom progressions":

- `I` to `VII`: scale degree, upper or lower case; a trailing `b` lowers it a half step (`VIIb`)
- `m` and any other text outside asterisks is shown as written; every `i` and `v` there is read as a numeral
- `*7*`: the chord type, shown in superscript and kept exactly as written
- `-` next chord in the same bar, `|` next bar, `||` alternatives (one is picked at random for each key)

Chords in G, D, A, E and B are spelled with sharps, in all other keys with flats.

## Rules for this folder

- No imports from Angular, the DOM or Tone.js, so the code runs anywhere.
- Relative imports name the `.ts` file, and the code uses only TypeScript syntax that can be erased (no enums, no constructor parameter properties). That way Node.js 24 runs the files directly, without a build step.
- Randomness comes in through a `Random` parameter (`Math.random` by default), so tests can use `seededRandom`.
- The code type-checks with `strict` and `noUncheckedIndexedAccess` (see `tsconfig.json` in this folder), so projects with strict settings can import it.

## Tests

```bash
npm run test:engine
npm run typecheck:engine
```

The tests use Node's built-in test runner and run without a browser.

import { noteInKey, type Key } from './keys.ts';
import { pick, type Random } from './random.ts';

/** A piece of a chord symbol: the chord type (written between asterisks) is shown in superscript. */
export interface ChordPart {
  text: string;
  superscript: boolean;
}

export interface Chord {
  /** The note the chord is built on, such as 'Bb' or 'F#'; null when the symbol starts with no note. */
  root: string | null;
  /** The chord symbol, for example [{ text: 'Dm' }, { text: '7', superscript: true }]. */
  parts: ChordPart[];
}

/** One bar of a progression in a key: up to four chords, more are possible but get no bass line. */
export interface Bar {
  key: Key;
  chords: Chord[];
}

/** The bars of a progression in one key: always at least one. */
export type Bars = [Bar, ...Bar[]];

/** Half steps from the root for each scale degree of a major scale. */
const DEGREE_STEPS: Record<string, number> = { I: 0, II: 2, III: 4, IV: 5, V: 7, VI: 9, VII: 11 };

/** Longest numerals first, so VII is not read as V + II. A trailing b lowers the degree a half step. */
const NUMERALS = /(VII|VI|V|IV|III|II|I)(b?)/gi;

const ROOT = /^[A-G][#b]?/;

/** The alternatives of a progression: an array, or a string with alternatives separated by '||'. */
export function alternatives(progression: string | readonly string[]): string[] {
  const list = typeof progression === 'string' ? [progression] : progression;
  return list.flatMap((alternative) => alternative.split('||'));
}

/** The bars of a progression in a key. With several alternatives, one is picked at random. */
export function progressionInKey(
  progression: string | readonly string[],
  key: Key,
  random: Random = Math.random,
): Bars {
  return barsInKey(pick(alternatives(progression), random), key);
}

/** The bars of one alternative ('|' separates bars). Empty bars are left out, but there is always one bar. */
export function barsInKey(alternative: string, key: Key): Bars {
  const [first, ...rest] = alternative
    .split('|')
    .map((bar) => ({ key, chords: chordsInKey(bar, key) }))
    .filter((bar) => bar.chords.length > 0);
  return first ? [first, ...rest] : [{ key, chords: [] }];
}

/** The chords of one bar ('-' separates chords, except between asterisks). */
export function chordsInKey(bar: string, key: Key): Chord[] {
  const chords: Chord[] = [];
  let parts: ChordPart[] = [];

  // Odd tokens are chord types with their asterisks, even tokens the text around them
  bar.split(/(\*[^*]*\*)/).forEach((token, index) => {
    if (index % 2 === 1) {
      parts.push({ text: token.slice(1, -1), superscript: true });
      return;
    }
    token.split('-').forEach((piece, pieceIndex) => {
      if (pieceIndex > 0) {
        addChord(chords, parts);
        parts = [];
      }
      parts.push({ text: resolveNumerals(piece, key), superscript: false });
    });
  });
  addChord(chords, parts);

  return chords;
}

function addChord(chords: Chord[], parts: ChordPart[]) {
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (first && !first.superscript) {
    first.text = first.text.trimStart();
  }
  if (last && !last.superscript) {
    last.text = last.text.trimEnd();
  }
  const kept = parts.filter((part) => part.text !== '');
  const head = kept[0];
  if (!head) {
    return;
  }
  const root = head.superscript ? null : (head.text.match(ROOT)?.[0] ?? null);
  chords.push({ root, parts: kept });
}

/**
 * Replaces the Roman numerals (I–VII, upper or lower case, a trailing b lowers them a half step)
 * with the note names of the key. Only use it on text outside the asterisks.
 */
export function resolveNumerals(text: string, key: Key): string {
  return text.replace(NUMERALS, (_, numeral: string, flat: string) => {
    const step = (DEGREE_STEPS[numeral.toUpperCase()] ?? 0) - (flat ? 1 : 0);
    return noteInKey(key, step);
  });
}

/** The chord symbol as plain text, for example 'Dm7' or 'Bm7(b5)'. */
export function chordToText(chord: Chord): string {
  return chord.parts.map((part) => part.text).join('');
}

/** The chord symbol as HTML with the chord type in <sup>, for example 'Dm<sup>7</sup>'. The text is escaped. */
export function chordToHtml(chord: Chord): string {
  return chord.parts
    .map((part) => (part.superscript ? `<sup>${escapeHtml(part.text)}</sup>` : escapeHtml(part.text)))
    .join('');
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

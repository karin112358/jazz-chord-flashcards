import type { KeyOrder } from './key-orders.ts';
import { defaultKeyRatings, ratingOf, type KeyRatings } from './key-ratings.ts';
import { FLAT_KEYS, transposeKey, type Key } from './keys.ts';
import { progressionInKey, type Bar, type Bars } from './progression.ts';
import { pick, type Random } from './random.ts';

export interface ChordSequenceOptions {
  /** The progression in Roman numerals, or several alternatives. */
  progression: string | readonly string[];
  keyOrder: KeyOrder;
  /** Defaults to rating 1 for every key. */
  keyRatings?: KeyRatings;
  /** When false, all keys come up equally often and the ratings are ignored. Defaults to true. */
  weightKeys?: boolean;
}

/** Half steps per new key for the interval key orders. */
const INTERVAL_STEPS: Partial<Record<KeyOrder, number>> = { '5': 5, '-5': -5 };

/**
 * An endless stream of bars: the progression in one key after the other, never the same key
 * twice in a row. A progression of several bars is played to the end before the key changes.
 */
export class ChordSequence {
  private options: Required<ChordSequenceOptions>;
  private readonly random: Random;
  /** The key of the bars handed out last; null before the first bar. */
  private currentKey: Key | null = null;
  /** Bars of the current key that are still to come. */
  private queue: Bar[] = [];
  /** Weighted cycle: the number of the current cycle and the keys it has left. */
  private cycle = 0;
  private cycleKeys: Key[] = [];

  constructor(options: ChordSequenceOptions, random: Random = Math.random) {
    this.options = withDefaults(options);
    this.random = random;
  }

  /**
   * Changes the options; the next key and progression use them. Bars of a progression that has
   * already started still come first. New ratings or weighting start a fresh weighted cycle.
   */
  configure(options: Partial<ChordSequenceOptions>): void {
    const next = withDefaults({ ...this.options, ...definedOnly(options) });
    if (next.keyRatings !== this.options.keyRatings || next.weightKeys !== this.options.weightKeys) {
      this.cycleKeys = [];
    }
    this.options = next;
  }

  /** Starts over: the next bar starts a progression in a new first key (C for the interval orders). */
  reset(): void {
    this.currentKey = null;
    this.queue = [];
    this.cycle = 0;
    this.cycleKeys = [];
  }

  /** The next bar. */
  next(): Bar {
    const queued = this.queue.shift();
    if (queued) {
      return queued;
    }
    const [first, ...rest] = this.startProgression();
    this.queue = rest;
    return first;
  }

  /** The next bars, one after the other. */
  take(count: number): Bar[] {
    return Array.from({ length: count }, () => this.next());
  }

  /**
   * All bars of the progression in the next key, for example to print one key per line. If next()
   * has started a progression, the bars still missing from it come first.
   */
  nextProgression(): Bars {
    const [first, ...rest] = this.queue;
    if (first) {
      this.queue = [];
      return [first, ...rest];
    }
    return this.startProgression();
  }

  /** The progression in the next key. */
  private startProgression(): Bars {
    const key = this.nextKey();
    this.currentKey = key;
    return progressionInKey(this.options.progression, key, this.random);
  }

  private nextKey(): Key {
    const order = this.options.keyOrder;
    if (order === 'WC') {
      return this.nextKeyInCycle();
    }
    const step = INTERVAL_STEPS[order];
    if (step !== undefined) {
      return this.currentKey === null ? 'C' : transposeKey(this.currentKey, step);
    }
    return this.randomKey();
  }

  /** Random: a key with rating r has 6 - r tickets (1 each when unweighted); the current key is left out. */
  private randomKey(): Key {
    const tickets = FLAT_KEYS.filter((key) => key !== this.currentKey).flatMap((key) =>
      Array<Key>(this.options.weightKeys ? 6 - ratingOf(this.options.keyRatings, key) : 1).fill(key),
    );
    return pick(tickets, this.random);
  }

  /**
   * Weighted cycle: cycle n has every key whose rating divides n (every key when unweighted), in
   * random order. When only the current key is left in a cycle, it waits for a later cycle.
   */
  private nextKeyInCycle(): Key {
    for (;;) {
      while (this.cycleKeys.length === 0) {
        this.cycle++;
        this.cycleKeys = FLAT_KEYS.filter(
          (key) => this.cycle % (this.options.weightKeys ? ratingOf(this.options.keyRatings, key) : 1) === 0,
        );
      }
      const candidates = this.cycleKeys.filter((key) => key !== this.currentKey);
      if (candidates.length === 0) {
        this.cycleKeys = [];
        continue;
      }
      const key = pick(candidates, this.random);
      this.cycleKeys = this.cycleKeys.filter((k) => k !== key);
      return key;
    }
  }
}

function withDefaults(options: ChordSequenceOptions): Required<ChordSequenceOptions> {
  return {
    progression: options.progression,
    keyOrder: options.keyOrder,
    keyRatings: options.keyRatings ?? defaultKeyRatings(),
    weightKeys: options.weightKeys ?? true,
  };
}

/** The options without the ones set to undefined, so these keep their current value. */
function definedOnly(options: Partial<ChordSequenceOptions>): Partial<ChordSequenceOptions> {
  return Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined));
}

import { FLAT_KEYS, isKey, type Key } from './keys.ts';

/** How well the player knows a key: 1 (unfamiliar) to 5 (well known). */
export type Rating = 1 | 2 | 3 | 4 | 5;

export interface KeyRating {
  key: Key;
  rating: Rating;
}

/** The rating of every key, in the order of FLAT_KEYS. The app stores it as JSON in this shape. */
export interface KeyRatings {
  keys: KeyRating[];
}

/** All twelve keys with rating 1. */
export function defaultKeyRatings(): KeyRatings {
  return { keys: FLAT_KEYS.map((key) => ({ key, rating: 1 })) };
}

export function isRating(value: unknown): value is Rating {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

/** Reads stored ratings; anything that is not a rating for each of the twelve keys gives the defaults. */
export function parseKeyRatings(json: string | null | undefined): KeyRatings {
  if (!json) {
    return defaultKeyRatings();
  }
  try {
    const parsed: unknown = JSON.parse(json);
    const keys = (parsed as { keys?: unknown } | null)?.keys;
    if (
      Array.isArray(keys) &&
      keys.length === FLAT_KEYS.length &&
      keys.every((k) => typeof k?.key === 'string' && isKey(k.key) && isRating(k.rating)) &&
      new Set(keys.map((k) => k.key)).size === FLAT_KEYS.length
    ) {
      return { keys: keys.map((k: KeyRating) => ({ key: k.key, rating: k.rating })) };
    }
  } catch {
    // Not JSON: fall back to the defaults
  }
  return defaultKeyRatings();
}

/** The rating of a key; 1 when the ratings do not list it. */
export function ratingOf(ratings: KeyRatings, key: Key): Rating {
  return ratings.keys.find((k) => k.key === key)?.rating ?? 1;
}

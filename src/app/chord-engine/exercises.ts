/** A predefined exercise: a chord progression in Roman numerals (syntax in README.md). */
export interface Exercise {
  readonly name: string;
  /** One progression, or several alternatives of which one is picked at random for each key. */
  readonly progression: string | readonly string[];
}

/** The name of the exercise whose progression the user writes. */
export const CUSTOM_EXERCISE = 'Custom';

export const DEFAULT_CUSTOM_PROGRESSION = 'iim*7* - V*7* | I*maj7*';

export const EXERCISES: readonly Exercise[] = [
  { name: 'Major 7', progression: 'I*maj7*' },
  { name: 'Minor 7', progression: 'Im*7*' },
  { name: 'Dominant 7', progression: 'I*7*' },
  { name: 'Maj 7 / Min 7 / Dom 7', progression: ['I*maj7*', 'Im*7*', 'I*7*'] },
  { name: 'ii7 - V7 - Imaj7 (one bar)', progression: 'iim*7* - V*7* - I*maj7*' },
  { name: 'ii7 - V7 - Imaj7 (two bars)', progression: 'iim*7* - V*7* | I*maj7*' },
  { name: 'ii7(b5) - V7 - Im6 (one bar)', progression: 'iim*7(b5)* - V*7* - im*6*' },
  { name: 'ii7(b5) - V7 - Im6 (two bars)', progression: 'iim*7(b5)* - V*7* | im*6*' },
  { name: 'Imaj7 - vi7 - ii7 - V7 (one bar)', progression: 'I*maj7* - vim*7* - iim*7* - V*7*' },
  { name: 'Imaj7 - vi7 - ii7 - V7 (two bars)', progression: 'I*maj7* - vim*7* | iim*7* - V*7*' },
  { name: CUSTOM_EXERCISE, progression: DEFAULT_CUSTOM_PROGRESSION },
];

export function findExercise(name: string): Exercise | undefined {
  return EXERCISES.find((exercise) => exercise.name === name);
}

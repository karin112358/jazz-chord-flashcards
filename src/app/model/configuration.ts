export const exercises = [
  {
    name: 'Major 7',
    configuration: 'I*maj7*',
    root: ['I'],
  },
  {
    name: 'Minor 7',
    configuration: 'Im*7*',
    root: ['I'],
  },
  {
    name: 'Dominant 7',
    configuration: 'I*7*',
    root: ['I'],
  },
  {
    name: 'Maj 7 / Min 7 / Dom 7',
    configuration: ['I*maj7*', 'Im*7*', 'I*7*'],
    root: ['I'],
  },
  {
    name: 'ii7 - V7 - Imaj7 (one bar)',
    configuration: 'iim*7* - V*7* - I*maj7*',
    root: ['I'],
  },
  {
    name: 'ii7 - V7 - Imaj7 (two bars)',
    configuration: 'iim*7* - V*7* | I*maj7*',
    root: ['I'],
  },
  {
    name: 'ii7(b5) - V7 - Im6 (one bar)',
    configuration: 'iim*7(b5)* - V*7* - im*6*',
    root: ['I'],
  },
  {
    name: 'ii7(b5) - V7 - Im6 (two bars)',
    configuration: 'iim*7(b5)* - V*7* | im*6*',
    root: ['I'],
  },
  {
    name: 'Imaj7 - vi7 - ii7 - V7 (one bar)',
    configuration: 'I*maj7* - vim*7* - iim*7* - V*7*',
    root: ['I'],
  },
  {
    name: 'Imaj7 - vi7 - ii7 - V7 (two bars)',
    configuration: 'I*maj7* - vim*7* | iim*7* - V*7*',
    root: ['I'],
  },
  {
    name: 'Custom',
    configuration: 'iim*7* - V*7* | I*maj7*',
    root: ['I'],
  },
];

export const keys = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
];

export const keysSharp = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

export const modes = [
  { name: 'Random', key: 'R' },
  { name: 'Perfect 4th up', key: '5' },
  { name: 'Perfect 4th down', key: '-5' },
  // { name: 'Major 3rd up', key: '4' },
  // { name: 'Major 3rd down', key: '-4' },
  // { name: 'Minor 3rd up', key: '3' },
  // { name: 'Minor 3rd down', key: '-3' },
  // { name: 'Major 2nd up', key: '2' },
  // { name: 'Major 2nd down', key: '-2' },
  // { name: 'Minor 2nd up', key: '1' },
  // { name: 'Minor 2nd down', key: '-1' },
];

/*chordTypes = [
    { key: 'major', name: 'Major', symbol: 'maj7', subscript: false },
    { key: 'minor', name: 'Minor', symbol: '-7', subscript: false },
    { key: 'dominant', name: 'Dominant', symbol: '7', subscript: false },
    //{ key: 'diminished', name: 'Diminished', symbol: 'dim', subscript: true },
    // { key: 'half diminished', name: 'Half-Diminished', symbol: 'ø' },
    // { key: 'augmented', name: 'Augmented', symbol: '+' },
  ];*/

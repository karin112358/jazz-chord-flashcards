export const configuration = [
  {
    name: 'Major 7',
    configuration: 'I<sup>maj7</sup>',
  },
  {
    name: 'Minor 7',
    configuration: 'Im<sup>7</sup>',
  },
  {
    name: 'Dominant 7',
    configuration: 'I<sup>7</sup>',
  },
  {
    name: 'Maj 7 / Min 7 / Dom 7',
    configuration: ['I<sup>maj7</sup>', 'Im<sup>7</sup>', 'I<sup>7</sup>'],
  },
  {
    name: 'ii7 - V7 - Imaj7',
    configuration: 'iim<sup>7</sup> - V<sup>7</sup> - I<sup>maj7</sup>',
  },
  {
    name: 'ii7(b5) - V7 - Im6',
    configuration: 'iim<sup>7(b5)</sup> - V<sup>7</sup> - Im<sup>6</sup>',
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

export const changeLog = [
  {
    date: '2025-01-08',
    changes: "Added modes: 'Perfect 4th up' and 'Perfect 4th down'",
  },
  {
    date: '2025-01-10',
    changes: 'Angular 19 update, added Angular Material Design',
  },
];

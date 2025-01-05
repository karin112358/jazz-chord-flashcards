export const major251 = {
  title: 'Major ii - V - I',
  beats: 4,
  configuration: {
    voicings: ['Rooted Voicing', 'A Voicing', 'B Voicing']
  },
  chords: [
    {
      length: 2,
      chord: `{}
{key=random(keys)}min`,
    },
    {
      length: 2,
      chord: '{key+5}7',
    },
    {
      length: 4,
      chord: '{key-2}maj7',
    },
  ],
};

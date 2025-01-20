import { Component } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'app-documentation',
  imports: [MarkdownComponent],
  templateUrl: './documentation.component.html',
  styleUrl: './documentation.component.scss',
})
export class DocumentationComponent {
  documentation = `# Documentation

Welcome to the **Jazz Chord Trainer**! This tool is designed to help musicians practice jazz chords efficiently and
improve their skills. Below, you'll find instructions and details about the app's features.

---

## Features

### Random Chord Flashcards

The app generates chords randomly to challenge your ability to recognize and play various jazz chords.

### Configurable Tempo

Use the tempo adjustment buttons to set the speed at which chords are displayed:

- **Increase Tempo**: +1 or +10 BPM
- **Decrease Tempo**: -1 or -10 BPM

### Chord Selection

Choose the chord types you want to practice:
- Major 7
- Minor 7
- Dominant 7
- ii7 - V7 - Imaj7 Progressions
- And more…

### Practice Modes

Select how the chords are presented:

- **Random**: Chords appear in random order.
- **Perfect 4th Up**: Chords progress by ascending perfect fourths.
- **Perfect 4th Down**: Chords progress by descending perfect fourths.

### Key Configuration
Use the "Configure Keys" button to rate your proficiency with individual keys.
- **Higher ratings (5)**: Keys appear less often in practice.
- **Lower ratings (1)**: Keys appear more frequently.

---

## Tips
- Start with a slower tempo to focus on accuracy. Gradually increase the speed as you improve.
- Use the "Configure Keys" feature to focus on your weaker areas.
- Practice regularly to internalize chord progressions and improve muscle memory.

---

## Known Issues
- **Metronome Sound on iOS**: The metronome click may not play on iOS devices. A fix is in progress.

---

## Feedback and Updates

This app is constantly evolving based on user feedback. If you have suggestions or encounter issues, please share them
[here](contact).`;
}

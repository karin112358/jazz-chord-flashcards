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

Welcome to the Jazz Chord Trainer! This tool is designed to help musicians efficiently practice jazz chords and improve their skills. Below, you'll find instructions and details about the app's features.

## Features

### Random Chord Flashcards

The app generates chords randomly to challenge your ability to recognize and play various jazz chords.

### Configurable Tempo

Use the tempo adjustment buttons to set the speed at which chords are displayed:

- **Increase Tempo:** +1 or +10 BPM
- **Decrease Tempo:** -1 or -10 BPM

### Chord Selection

Choose the chord types you want to practice:
- Major 7
- Minor 7
- Dominant 7
- ii7 - V7 - Imaj7 progressions
- And more ...

#### Custom Chord Configuration

If you select the 'Custom' configuration, a textbox will appear, allowing you to enter your own chord progression.

- Use **||** to split multiple configurations that should be chosen randomly.
- Use **|** to indicate bar divisions.
- Use **-** to separate chords within a bar.
- Use **&ast;** to denote chord types (e.g., maj7, 7, 6, m7(b5)) that should be displayed in superscript.

Here are same samples for configurations:

| Configuration | Result |
| --- | --- |
| I&ast;maj7&ast; | C<sup>maj7</sup> |
| iim&ast;7&ast; - V&ast;7&ast; | Dm<sup>7</sup> - G<sup>7</sup> |
| I&ast;maj7&ast; &vert;&vert; Im&ast;7&ast; &vert;&vert; I&ast;7&ast; | choses one of C<sup>maj7</sup>, Cm<sup>7</sup>, C<sup>7</sup> |
| iim&ast;7(b5)&ast; - V&ast;7&ast; &vert; im&ast;6&ast; | 1<sup>st</sup> bar: Dm<sup>7(b5)</sup> - G<sup>7</sup><br/>2<sup>nd</sup> bar: Cm<sup>6</sup> |

### Practice Modes

Choose how chords are presented during practice:

- **Random:** Chords appear in a completely random order.
- **Weighted Cycle:** Chords appear in cycles; ratings determine in how many cycles a key appears (1* - key appears in every cycle, 5* - key appears in every 5th cycle).
- **Perfect 4th Up:** Chords progress by ascending perfect fourths.
- **Perfect 4th Down:** Chords progress by descending perfect fourths.

### Play Root Note

If you enable the **Play Root Note** option, the app will play the root note of the current chord on the 1st and 3rd beat of each bar. If more than two chords occur within a single bar, the root note will be played on every beat.

Please note that the current sound is not great. A better and more realistic sound will be added in an upcoming update.

### Key Configuration

Use the "Configure Keys" button to customize your practice based on your proficiency with different keys:
- **Higher ratings (5):** Less frequent appearance of the key in practice.
- **Lower ratings (1):** More frequent appearance of the key in practice.

## Tips

- Start with a slower tempo to focus on accuracy and gradually increase the speed as you improve.
- Use the "Configure Keys" feature to target weaker areas in your playing.
- Practice regularly to internalize chord progressions and develop muscle memory.

## Feedback and Updates

This app is constantly evolving based on user feedback. If you have suggestions or encounter issues, please reach out via email: [charlie@practice-jazz-chords.com](mailto:charlie@practice-jazz-chords.com)`;
}

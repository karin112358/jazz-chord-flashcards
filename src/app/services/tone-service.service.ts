import { computed, Injectable, signal, WritableSignal } from '@angular/core';
import * as Tone from 'tone';

@Injectable({
  providedIn: 'root',
})
export class ToneServiceService {
  nextBarRoot: string[] = ['C'];
  readonly beat: WritableSignal<number> = signal(-1);
  readonly tempo: WritableSignal<number> = signal(60);

  private synth: Tone.Synth | null = null;
  private drumStickPlayer = new Tone.Player('./assets/sound/drumsticks.mp3');
  private currentBarRoot: string[] = ['C'];

  constructor() {
    this.drumStickPlayer.connect(Tone.getDestination());

    Tone.getTransport().scheduleRepeat((time) => {
      if (this.synth) {
        const beat = parseInt(
          Tone.getTransport().position.toString().split(':')[1]
        );

        if (beat % 4 === 0) {
          this.currentBarRoot = this.nextBarRoot;
        }

        const now = Tone.now();
        const root = this.currentBarRoot[0];
        let note = root + '2';
        if (root.startsWith('A') || root.startsWith('B')) {
          note = root + '1';
        }

        if (beat % 4 === 0 || beat % 4 === 2) {
          this.synth.triggerAttackRelease(note, '4n', now);
        }

        this.drumStickPlayer.start();

        this.beat.set(beat);
      }
    }, '4n');
  }

  async start() {
    if (!this.synth) {
      await Tone.start();
      this.synth = new Tone.Synth().toDestination();
      this.synth.oscillator.type = 'sine';
      // const feedbackDelay = new Tone.FeedbackDelay('8n.', 0.7);
      // this.synth.connect(feedbackDelay);
      // feedbackDelay.toDestination();
      // this.synth.envelope.attack = 0;
      // this.synth.envelope.decay = 0;
      Tone.getTransport().bpm.value = this.tempo();
    }

    Tone.getTransport().start();
  }

  stop() {
    Tone.getTransport().stop();
    this.beat.set(-1);
  }

  setTempo(tempo: number) {
    this.tempo.set(tempo);

    if (this.synth) {
      Tone.getTransport().bpm.value = this.tempo();
    }
  }
}

import { Injectable, signal, WritableSignal } from '@angular/core';
import * as Tone from 'tone';

@Injectable({
  providedIn: 'root',
})
export class ToneService {
  nextBarRoot: string[] = ['empty', 'empty', 'empty', 'empty'];
  playRootNote: boolean = true;
  walking = false;
  readonly beat: WritableSignal<number> = signal(-1);
  readonly tempo: WritableSignal<number> = signal(60);

  private synth: Tone.MonoSynth | null = null;
  private drumStickPlayer = new Tone.Player('./assets/sound/drumsticks.mp3');
  private currentBarRoot: string[] = ['empty', 'empty', 'empty', 'empty'];

  constructor() {
    this.drumStickPlayer.connect(Tone.getDestination());

    Tone.getTransport().scheduleRepeat((time) => {
      if (this.synth) {
        const beat = parseInt(
          Tone.getTransport().position.toString().split(':')[1],
        );

        if (beat % 4 === 0) {
          this.currentBarRoot = this.nextBarRoot;
        }

        if (
          this.playRootNote &&
          this.currentBarRoot[0] !== 'empty' &&
          (beat % 4 === 0 || beat % 4 === 2 || this.walking)
        ) {
          const now = Tone.now();
          const root = this.currentBarRoot[beat % 4];

          // get right octave
          let note = root + '2';
          if (root.startsWith('A') || root.startsWith('B')) {
            note = root + '1';
          }

          // play bass note
          this.synth.triggerAttackRelease(
            note,
            this.walking ? '8n' : '4n',
            now,
          );
        }

        // metronome click
        this.drumStickPlayer.start();

        this.beat.set(beat);
      }
    }, '4n');
  }

  async start() {
    this.nextBarRoot = ['empty', 'empty', 'empty', 'empty'];

    if (!this.synth) {
      await Tone.start();
      this.synth = new Tone.MonoSynth().toDestination();
      this.synth.oscillator.type = 'fmsine';
      this.synth.envelope.attack = 0.0;
      this.synth.envelope.attackCurve = 'exponential';
      this.synth.envelope.decay = 0.5;
      this.synth.envelope.decayCurve = 'exponential';
      this.synth.envelope.sustain = 0.1;
      this.synth.envelope.release = 0.8;
      this.synth.envelope.releaseCurve = 'exponential';
      this.synth.portamento = 0.0;
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

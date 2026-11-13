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

  // Audio objects are created on the first start, in the browser only: during prerendering
  // there is no Web Audio, and creating them there would break the server render.
  private synth: Tone.MonoSynth | null = null;
  private drumStickPlayer: Tone.Player | null = null;
  private currentBarRoot: string[] = ['empty', 'empty', 'empty', 'empty'];

  /** The audio setup of the first start; reset when it fails, so the next start tries again. */
  private initialized: Promise<void> | null = null;
  /** Counts starts and stops, so a start that is still loading knows when it was cancelled. */
  private request = 0;

  /** Starts the transport once the audio is ready. Rejects when the audio cannot be set up. */
  async start(): Promise<void> {
    const request = ++this.request;
    this.nextBarRoot = ['empty', 'empty', 'empty', 'empty'];
    this.initialized ??= this.init().catch((error) => {
      this.initialized = null;
      throw error;
    });
    await this.initialized;

    // Stop was pressed while the audio was loading
    if (request !== this.request) {
      return;
    }
    Tone.getTransport().start();
  }

  stop() {
    this.request++;
    if (this.synth) {
      Tone.getTransport().stop();
    }
    this.beat.set(-1);
  }

  setTempo(tempo: number) {
    this.tempo.set(tempo);

    if (this.synth) {
      Tone.getTransport().bpm.value = this.tempo();
    }
  }

  private async init(): Promise<void> {
    await Tone.start();

    const drumStickPlayer = new Tone.Player('./assets/sound/drumsticks.mp3').toDestination();
    const synth = new Tone.MonoSynth().toDestination();
    synth.oscillator.type = 'fmsine';
    synth.envelope.attack = 0.0;
    synth.envelope.attackCurve = 'exponential';
    synth.envelope.decay = 0.5;
    synth.envelope.decayCurve = 'exponential';
    synth.envelope.sustain = 0.1;
    synth.envelope.release = 0.8;
    synth.envelope.releaseCurve = 'exponential';
    synth.portamento = 0.0;

    // The click sample must be ready before the first beat
    try {
      await Tone.loaded();
    } catch (error) {
      drumStickPlayer.dispose();
      synth.dispose();
      throw error;
    }

    // Only a complete setup is kept and scheduled, so a retry after a failure starts clean
    this.drumStickPlayer = drumStickPlayer;
    this.synth = synth;
    Tone.getTransport().bpm.value = this.tempo();
    Tone.getTransport().scheduleRepeat(() => this.onBeat(), '4n');
  }

  private onBeat() {
    if (!this.synth) {
      return;
    }
    const beat = parseInt(Tone.getTransport().position.toString().split(':')[1]);

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
      this.synth.triggerAttackRelease(note, this.walking ? '8n' : '4n', now);
    }

    // metronome click
    this.drumStickPlayer?.start();

    this.beat.set(beat);
  }
}

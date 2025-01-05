import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  signal,
} from '@angular/core';
import { Timer } from 'src/app/model/timer';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerComponent implements OnInit {
  @HostListener('document:keyup', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === ' ') {
      if (this.isRunning) {
        this.stop();
      } else {
        this.start();
      }
    } else if (event.key === 'ArrowLeft') {
      if (event.ctrlKey) {
        this.tempo -= 5;
      } else {
        this.tempo--;
      }

      if (this.isRunning) {
        this.changeTempo(this.tempo);
      }
    } else if (event.key === 'ArrowRight') {
      if (event.ctrlKey) {
        this.tempo += 5;
      } else {
        this.tempo++;
      }

      if (this.isRunning) {
        this.changeTempo(this.tempo);
      }
    }
  }

  tempo = 60;
  interval: any | null = null;
  currKey: string | null = null;
  prevKey: string | null = null;
  nextKey: string | null = null;
  counter = signal(-1);
  isRunning = false;
  private timer = new Timer((60 / this.tempo) * 1000, () => {
    this.counter.update((value) => value + 1);
    this.updateChord();
  });

  private keys = [
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
  private keysSharp = [
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
  private audioContext!: AudioContext;

  private voicingTypes = ['A Voicing', 'B Voicing', 'Rooted Voicing'];

  constructor() {
    this.audioContext = new window.AudioContext();
  }

  ngOnInit(): void {}

  start() {
    this.counter.set(-1);
    this.changeTempo(this.tempo);
    this;
    this.isRunning = true;
  }

  stop() {
    this.timer.stop();

    this.currKey = null;
    this.prevKey = null;
    this.nextKey = null;

    this.counter.set(-1);
    this.isRunning = false;
  }

  changeTempo(newTempo: number | string) {
    if (typeof newTempo === 'string') {
      this.tempo = parseInt(newTempo);
    } else {
      this.tempo = newTempo;
    }

    this.timer.stop();
    this.timer.setInterval((60 / this.tempo) * 1000);
    this.timer.run();
  }

  private updateChord(): void {
    if (this.counter() % 4 === 0) {
      this.prevKey = this.currKey ?? '&nbsp;';
      this.currKey = this.nextKey ?? '&nbsp;';
      this.nextKey = this.getNextKeyIIVI();

      while (this.nextKey === this.currKey) {
        this.nextKey = this.getNextKeyIIVI();
      }
    }

    // play sound
    const osc = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();

    osc.connect(envelope);
    envelope.connect(this.audioContext.destination);

    osc.frequency.value = this.counter() % 4 == 0 ? 600 : 400;
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(1, 0 + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, 0 + 0.02);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.03);
  }

  private getNextKeyIIVI(): string {
    let key = this.currKey;
    let keyIndex = 0;

    while (key === this.currKey) {
      keyIndex = Math.floor(Math.random() * this.keys.length);
      key = this.keys[keyIndex];
    }

    const voicingType =
      this.voicingTypes[Math.floor(Math.random() * this.voicingTypes.length)];

    let keys = this.keys;
    if (['G', 'D', 'A', 'E', 'B'].includes(this.keys[keyIndex])) {
      keys = this.keysSharp;
    }

    return `<span><span class="voicing-type">${voicingType}</span><br/>${
      keys[(keyIndex + 2) % 12]
    }min - ${keys[(keyIndex + 7) % 12]}7 - ${keys[keyIndex]}maj7`;
  }
}

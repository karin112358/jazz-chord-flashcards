import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  signal,
} from '@angular/core';
import { keys, keysSharp, modes } from 'src/app/model/configuration';
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
      let newTempo = this.tempo;
      if (event.ctrlKey) {
        newTempo -= 10;
      } else if (event.shiftKey) {
        newTempo -= 5;
      } else {
        newTempo--;
      }

      this.setTempo(newTempo);
    } else if (event.key === 'ArrowRight') {
      let newTempo = this.tempo;
      if (event.ctrlKey) {
        newTempo += 10;
      } else if (event.shiftKey) {
        newTempo += 5;
      } else {
        newTempo++;
      }

      this.setTempo(newTempo);
    }
  }

  minTempo = 20;
  maxTempo = 300;
  tempo = 60;
  currKey: string | null = null;
  nextKey1: string | null = null;
  nextKey2: string | null = null;
  counter = signal(-1);
  modes = modes;
  selectedMode = signal('R');

  private currentKeyIndex = -1;
  private nextKey1Index = -1;
  private nextKey2Index = -1;
  private keys = keys;
  private keysSharp = keysSharp;
  private isRunning = false;
  private timer = new Timer((60 / this.tempo) * 1000, () => {
    this.counter.update((value) => value + 1);
    this.updateChord();
  });

  private audioContext!: AudioContext;

  private voicingTypes = ['A Voicing', 'B Voicing', 'Rooted Voicing'];

  constructor() {
    this.audioContext = new window.AudioContext();
  }

  ngOnInit(): void {}

  start() {
    this.counter.set(-1);

    this.timer.stop();
    this.timer.setInterval((60 / this.tempo) * 1000);
    this.timer.run();

    this.isRunning = true;
  }

  stop() {
    this.timer.stop();

    this.currKey = null;
    this.nextKey1 = null;
    this.nextKey2 = null;
    this.counter.set(-1);
    this.isRunning = false;
  }

  changeTempo(change: number) {
    if (change > 0) {
      if (this.tempo + change > this.maxTempo) {
        this.tempo = this.maxTempo;
      } else {
        this.tempo += change;
      }
    } else {
      if (this.tempo + change < this.minTempo) {
        this.tempo = this.minTempo;
      } else {
        this.tempo += change;
      }
    }

    if (this.isRunning) {
      this.timer.stop();
      this.timer.setInterval((60 / this.tempo) * 1000);
      this.timer.run();
    }
  }

  setTempo(newTempo: number | string) {
    if (typeof newTempo === 'string') {
      this.tempo = parseInt(newTempo);
    } else {
      this.tempo = newTempo;
    }

    if (this.isRunning) {
      this.timer.stop();
      this.timer.setInterval((60 / this.tempo) * 1000);
      this.timer.run();
    }
  }

  setMode(event: Event) {
    if (event.target && 'value' in event.target) {
      this.selectedMode.set(<string>event.target.value);
    }
  }

  private updateChord(): void {
    if (this.counter() % 4 === 0) {
      this.currKey = this.nextKey1 ?? '&nbsp;';
      this.currentKeyIndex = this.nextKey1Index;

      this.nextKey1 = this.nextKey2 ?? '&nbsp;';
      this.nextKey1Index = this.nextKey2Index;
      while (this.nextKey1 === this.currKey) {
        const nextChord = this.getNextChord(this.currentKeyIndex);
        this.nextKey1 = nextChord.chord;
        this.nextKey1Index = nextChord.index;
      }

      const nextChord = this.getNextChord(this.nextKey1Index);
      this.nextKey2 = nextChord.chord;
      this.nextKey2Index = nextChord.index;
      while (this.nextKey2 === this.nextKey1) {
        const nextChord = this.getNextChord(this.nextKey1Index);
        this.nextKey2 = nextChord.chord;
        this.nextKey2Index = nextChord.index;
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

  private getNextChord(currentKeyIndex: number): {
    index: number;
    chord: string;
  } {
    let key = this.keys[currentKeyIndex];
    let keyIndex = 0;

    while (key === this.keys[currentKeyIndex]) {
      if (this.selectedMode() === 'R') {
        keyIndex = Math.floor(Math.random() * this.keys.length);
      } else {
        //const currentKeyIndex = this.keys.indexOf(currKey);
        const mode = parseInt(this.selectedMode());
        keyIndex = (currentKeyIndex + mode) % this.keys.length;
      }

      key = this.keys[keyIndex];
    }

    const voicingType =
      this.voicingTypes[Math.floor(Math.random() * this.voicingTypes.length)];

    let keys = this.keys;
    if (['G', 'D', 'A', 'E', 'B'].includes(this.keys[keyIndex])) {
      keys = this.keysSharp;
    }

    /*return `<span><span class="voicing-type">${voicingType}</span><br/>${
      keys[(keyIndex + 2) % 12]
    }min - ${keys[(keyIndex + 7) % 12]}7 - ${keys[keyIndex]}maj7`;*/
    return { index: keyIndex, chord: `${keys[keyIndex]}<sup>maj7</sup>` };
  }
}

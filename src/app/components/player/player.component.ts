import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  signal,
} from '@angular/core';
import { metronomAudio } from 'src/app/model/metronom-audio';

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
  snd = new Audio(metronomAudio);
  isRunning = false;

  keys = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  keysSharp = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  chordTypes = [
    { key: 'major', name: 'Major', symbol: 'maj7', subscript: false },
    { key: 'minor', name: 'Minor', symbol: '-7', subscript: false },
    { key: 'dominant', name: 'Dominant', symbol: '7', subscript: false },
    //{ key: 'diminished', name: 'Diminished', symbol: 'dim', subscript: true },
    // { key: 'half diminished', name: 'Half-Diminished', symbol: 'ø' },
    // { key: 'augmented', name: 'Augmented', symbol: '+' },
  ];

  voicingTypes = ['A Voicing', 'B Voicing', 'Rooted Voicing'];

  constructor() {}

  ngOnInit(): void {}

  start() {
    this.counter.set(0);
    this.changeTempo(this.tempo);
    this.isRunning = true;
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.counter.set(-1);
    this.isRunning = false;
  }

  changeTempo(newTempo: number | string) {
    if (typeof newTempo === 'string') {
      this.tempo = parseInt(newTempo);
    } else {
      this.tempo = newTempo;
    }

    this.counter.set(0);

    if (this.interval) {
      clearInterval(this.interval);
    }

    this.updateChord();
    this.interval = setInterval(() => {
      this.counter.update((value) => value + 1);
      this.updateChord();
    }, (60 / this.tempo) * 1000);
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

    this.beep();
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

  private getNextKeyChord(): string {
    let key = this.currKey;
    let keyIndex = 0;

    while (key === this.currKey) {
      keyIndex = Math.floor(Math.random() * this.keys.length);
      key = this.keys[keyIndex];
    }

    const chordType =
      this.chordTypes[Math.floor(Math.random() * this.chordTypes.length)];

    const voicingType =
      this.voicingTypes[Math.floor(Math.random() * this.voicingTypes.length)];

    return (
      '<span><span class="voicing-type">' +
      voicingType +
      '</span><br/>' +
      key +
      `</span><span class="type ${!!chordType.subscript ? 'subscript' : ''}">` +
      chordType.symbol +
      '</span>'
    );
  }

  private beep(): void {
    this.snd.play();
  }
}

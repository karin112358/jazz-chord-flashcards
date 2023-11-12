import {
  ChangeDetectionStrategy,
  Component,
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
  tempo = 60;
  interval: any | null = null;
  currKey: string | null = null;
  prevKey: string | null = null;
  nextKey: string | null = null;
  counter = signal(-1);
  snd = new Audio(metronomAudio);

  keys = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  chordTypes = [
    { key: '', name: '', symbol: '', subscript: false },
    // { key: 'major', name: 'Major', symbol: 'maj7', subscript: false },
    // { key: 'minor', name: 'Minor', symbol: '-7', subscript: false },
    // { key: 'dominant', name: 'Dominant', symbol: '7', subscript: false },
    //{ key: 'diminished', name: 'Diminished', symbol: 'dim', subscript: true },
    // { key: 'half diminished', name: 'Half-Diminished', symbol: 'ø' },
    // { key: 'augmented', name: 'Augmented', symbol: '+' },
  ];

  voicingTypes = ['A Voicing', 'B Voicing'];

  constructor() {}

  ngOnInit(): void {}

  start() {
    this.counter.set(0);
    this.changeTempo(this.tempo);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.counter.set(-1);
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
      this.nextKey = this.getNextKey();

      while (this.nextKey === this.currKey) {
        this.nextKey = this.getNextKey();
      }
    }

    this.beep();
  }

  private getNextKey(): string {
    let key = this.currKey;
    while (key === this.currKey) {
      key = this.keys[Math.floor(Math.random() * this.keys.length)];
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

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
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
  counter = 0;
  snd = new Audio(metronomAudio);

  keys = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  chordTypes = [
    { key: 'major', name: 'Major', symbol: 'maj7', subscript: false },
    { key: 'minor', name: 'Minor', symbol: '-7', subscript: false },
    { key: 'dominant', name: 'Dominant', symbol: '7', subscript: false },
    //{ key: 'diminished', name: 'Diminished', symbol: 'dim', subscript: true },
    // { key: 'half diminished', name: 'Half-Diminished', symbol: 'ø' },
    // { key: 'augmented', name: 'Augmented', symbol: '+' },
  ];

  constructor() {}

  ngOnInit(): void {}

  start() {
    this.counter = 0;
    this.changeTempo(this.tempo);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  changeTempo(newTempo: number | string) {
    if (typeof newTempo === 'string') {
      this.tempo = parseInt(newTempo);
    } else {
      this.tempo = newTempo;
    }

    this.counter = -1;

    if (this.interval) {
      clearInterval(this.interval);
    }

    this.updateChord();
    this.interval = setInterval(
      () => this.updateChord(),
      (60 / this.tempo) * 1000
    );
  }

  private updateChord(): void {
    if (this.counter % 4 === 0) {
      this.prevKey = this.currKey ?? '&nbsp;';
      this.currKey = this.nextKey ?? '&nbsp;';
      this.nextKey = this.getNextKey();

      while (this.nextKey === this.currKey) {
        this.nextKey = this.getNextKey();
      }
    }

    this.beep();
    this.counter++;
  }

  private getNextKey(): string {
    let key = this.currKey;
    while (key === this.currKey) {
      key = this.keys[Math.floor(Math.random() * this.keys.length)];
    }

    const chordType =
      this.chordTypes[Math.floor(Math.random() * this.chordTypes.length)];

    return (
      '<span>' +
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

import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  changeLog,
  configuration,
  keys,
  keysSharp,
  modes,
} from 'src/app/model/configuration';
import { Timer } from 'src/app/model/timer';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
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
    } else if (event.key === 'Escape') {
      this.closeShortcuts();
    } else if (event.key === 'ArrowLeft') {
      let newTempo = this.tempo();
      if (event.ctrlKey) {
        newTempo -= 10;
      } else if (event.shiftKey) {
        newTempo -= 5;
      } else {
        newTempo--;
      }

      this.setTempo(newTempo);
    } else if (event.key === 'ArrowRight') {
      let newTempo = this.tempo();
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
  tempo = signal(60);
  currKey: WritableSignal<string | null> = signal(null);
  nextKey1: WritableSignal<string | null> = signal(null);
  nextKey2: WritableSignal<string | null> = signal(null);
  counter = signal(-1);
  modes = modes;
  configuration = configuration;
  changeLog = changeLog;
  selectedMode = signal('R');
  selectedConfiguration: WritableSignal<{
    name: string;
    configuration: string | string[];
  }> = signal(configuration[0]);

  private currentKeyIndex = -1;
  private nextKey1Index = -1;
  private nextKey2Index = -1;
  private keys = keys;
  private keysSharp = keysSharp;
  private isRunning = false;
  private timer = new Timer((60 / this.tempo()) * 1000, () => {
    this.counter.update((value) => value + 1);
    this.updateChord();
  });

  private audioContext!: AudioContext;

  constructor() {
    this.audioContext = new window.AudioContext();
  }

  ngOnInit(): void {}

  start() {
    this.counter.set(-1);

    this.timer.stop();
    this.timer.setInterval((60 / this.tempo()) * 1000);
    this.timer.run();

    this.isRunning = true;
  }

  stop() {
    this.timer.stop();

    this.currentKeyIndex = -1;
    this.nextKey1Index = -1;
    this.nextKey2Index = -1;
    this.currKey.set(null);
    this.nextKey1.set(null);
    this.nextKey2.set(null);
    this.counter.set(-1);
    this.isRunning = false;
  }

  changeTempo(change: number) {
    if (change > 0) {
      if (this.tempo() + change > this.maxTempo) {
        this.tempo.set(this.maxTempo);
      } else {
        this.tempo.update((value) => value + change);
      }
    } else {
      if (this.tempo() + change < this.minTempo) {
        this.tempo.set(this.minTempo);
      } else {
        this.tempo.update((value) => value + change);
      }
    }

    if (this.isRunning) {
      //this.timer.stop();
      this.timer.setInterval((60 / this.tempo()) * 1000);
      //this.timer.run();
    }
  }

  setTempo(newTempo: number | string) {
    if (typeof newTempo === 'string') {
      this.tempo.set(parseInt(newTempo));
    } else {
      this.tempo.set(newTempo);
    }

    if (this.isRunning) {
      //this.timer.stop();
      this.timer.setInterval((60 / this.tempo()) * 1000);
      //this.timer.run();
    }
  }

  setMode(event: string) {
    if (event) {
      this.selectedMode.set(event);
    }
  }

  setConfiguration(event: string) {
    if (event) {
      this.selectedConfiguration.set(
        this.configuration.find((c) => c.name === event) ??
          this.configuration[0]
      );
    }
  }

  private updateChord(): void {
    if (this.counter() % 4 === 0) {
      this.currKey.set(this.nextKey1() ?? '&nbsp;');
      this.currentKeyIndex = this.nextKey1Index;

      this.nextKey1.set(this.nextKey2() ?? '&nbsp;');
      this.nextKey1Index = this.nextKey2Index;
      while (this.nextKey1() === this.currKey()) {
        const nextChord = this.getNextChord(this.currentKeyIndex);
        this.nextKey1.set(nextChord.chord);
        this.nextKey1Index = nextChord.index;
      }

      const nextChord = this.getNextChord(this.nextKey1Index);
      this.nextKey2.set(nextChord.chord);
      this.nextKey2Index = nextChord.index;
      while (this.nextKey2() === this.nextKey1()) {
        const nextChord = this.getNextChord(this.nextKey1Index);
        this.nextKey2.set(nextChord.chord);
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
        const mode = parseInt(this.selectedMode());

        if (currentKeyIndex === -1) {
          currentKeyIndex = mode * -1;
        }

        keyIndex = (currentKeyIndex + mode) % this.keys.length;
        while (keyIndex < 0) {
          keyIndex += this.keys.length;
        }
      }

      key = this.keys[keyIndex];
    }

    let keys = this.keys;
    if (['G', 'D', 'A', 'E', 'B'].includes(this.keys[keyIndex])) {
      keys = this.keysSharp;
    }

    let config = this.selectedConfiguration().configuration;
    if (Array.isArray(config)) {
      config = config[Math.floor(Math.random() * config.length)];
    }

    config = config.replace(/IIIb|iiib/g, keys[(keyIndex + 3) % 12]);
    config = config.replace(/III|iii/g, keys[(keyIndex + 4) % 12]);
    config = config.replace(/IIb|iib/g, keys[(keyIndex + 1) % 12]);
    config = config.replace(/II|ii/g, keys[(keyIndex + 2) % 12]);
    config = config.replace(/IV|iv/g, keys[(keyIndex + 5) % 12]);
    config = config.replace(/VIIb|viib/g, keys[(keyIndex + 10) % 12]);
    config = config.replace(/VII|vii/g, keys[(keyIndex + 11) % 12]);
    config = config.replace(/VIb|vib/g, keys[(keyIndex + 8) % 12]);
    config = config.replace(/VI|vi/g, keys[(keyIndex + 9) % 12]);
    config = config.replace(/I|i/g, keys[keyIndex]);
    config = config.replace(/Vb|vb/g, keys[(keyIndex + 6) % 12]);
    config = config.replace(/V|v/g, keys[(keyIndex + 7) % 12]);

    return { index: keyIndex, chord: config };
  }

  openShortcuts() {
    const dialog = document.querySelector('#shortcuts') as HTMLDialogElement;
    dialog.showModal();
  }

  closeShortcuts() {
    const dialog = document.querySelector('#shortcuts') as HTMLDialogElement;
    dialog.close();
  }
}

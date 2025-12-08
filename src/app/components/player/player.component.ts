import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  HostListener,
  OnInit,
  signal,
  untracked,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { exercises, keys, keysSharp, modes } from 'src/app/model/configuration';
import { ToneService } from 'src/app/services/tone.service';
import { KeysDialogComponent } from '../keys-dialog/keys-dialog.component';
import { KeysConfiguration } from 'src/app/model/keys-configuration';

type Chord = {
  index: number;
  chord: string;
};

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PlayerComponent implements OnInit, AfterViewInit {
  @ViewChild('silentAudio') silentAudio!: ElementRef<HTMLAudioElement>;

  @HostListener('document:keyup', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (
      event.target &&
      'localName' in event.target &&
      event.target.localName === 'textarea'
    ) {
      return;
    }

    if (event.key === ' ') {
      if (this.isRunning()) {
        this.stop();
      } else {
        this.start();
      }
    } else if (event.key === 'Escape') {
      this.closeShortcuts();
    } else if (event.key === 'ArrowLeft') {
      let newTempo = this.toneService.tempo();
      if (event.ctrlKey) {
        newTempo -= 10;
      } else if (event.shiftKey) {
        newTempo -= 5;
      } else {
        newTempo--;
      }

      this.setTempo(newTempo);
    } else if (event.key === 'ArrowRight') {
      let newTempo = this.toneService.tempo();
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
  readonly currKey: WritableSignal<string | null> = signal(null);
  readonly nextKey1: WritableSignal<string | null> = signal(null);
  modes = modes;
  exercises = exercises;
  readonly selectedMode = signal<'R' | 'WC' | number>('R');
  readonly isRunning = signal(false);
  readonly selectedExercise: WritableSignal<{
    name: string;
    configuration: string | string[];
    root: string[];
  }> = signal(exercises[0]);

  private currentKeyIndex = -1;
  private nextKey1Index = -1;
  private keys = keys;
  private keysSharp = keysSharp;
  private initialized = false;
  private keysConfiguration: KeysConfiguration = new KeysConfiguration();
  private probabilityMap: { [key: number]: number } = {};
  private probabilityCount = 0;
  private cycle = 0;
  private cycleKeys: string[] = [];
  private nextChordTasks: Chord[] = [];
  private readonly keyRegex = new RegExp(/^[A-H]+#?b?/);

  constructor(
    public toneService: ToneService,
    private dialog: MatDialog,
  ) {
    effect(() => {
      const beat = this.toneService.beat();
      if (beat % 4 === 0) {
        untracked(() => {
          this.updateChord();
        });
      }
    });

    this.loadConfiguration();
    this.initialized = true;
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.silentAudio.nativeElement.loop = true;
  }

  start() {
    this.silentAudio.nativeElement.play();
    this.toneService.start();
    this.isRunning.set(true);
    this.cycle = 0;
    this.cycleKeys = [];
    (<any>window).sa_event('click_start');
  }

  stop() {
    this.silentAudio.nativeElement.pause();
    this.toneService.stop();

    this.currentKeyIndex = -1;
    this.nextKey1Index = -1;
    this.currKey.set(null);
    this.nextKey1.set(null);
    this.isRunning.set(false);
  }

  changeTempo(change: number) {
    if (change > 0) {
      if (this.toneService.tempo() + change > this.maxTempo) {
        this.toneService.setTempo(this.maxTempo);
      } else {
        this.toneService.setTempo(this.toneService.tempo() + change);
      }
    } else {
      if (this.toneService.tempo() + change < this.minTempo) {
        this.toneService.setTempo(this.minTempo);
      } else {
        this.toneService.setTempo(this.toneService.tempo() + change);
      }
    }

    this.saveConfiguration();
  }

  setTempo(newTempo: number | string) {
    if (typeof newTempo === 'string') {
      this.toneService.setTempo(parseInt(newTempo));
    } else {
      this.toneService.setTempo(newTempo);
    }

    this.saveConfiguration();
  }

  setMode(key: 'R' | 'WC' | number) {
    if (key) {
      this.selectedMode.set(key);
      this.saveConfiguration();
    }
  }

  setExercise(name: string) {
    if (name) {
      this.selectedExercise.set(
        this.exercises.find((c) => c.name === name) ?? this.exercises[0],
      );
      this.saveConfiguration();
    }
  }

  setCustomExercise(config: Event) {
    const custom = this.exercises.find((e) => e.name === 'Custom');
    if (custom) {
      const customExercise = (<HTMLTextAreaElement>config.target).value;
      custom.configuration = customExercise;
      localStorage.setItem('customExercise', customExercise);
    }
  }

  setPlayRootNote(value: boolean) {
    this.toneService.playRootNote = value;
    this.saveConfiguration();
  }

  openKeysDialog(): void {
    const dialogRef = this.dialog.open(KeysDialogComponent, {
      data: { keysConfiguration: this.keysConfiguration },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      this.saveConfiguration();
    });
  }

  private updateChord(): void {
    this.currKey.set(this.nextKey1() ?? '');
    this.currentKeyIndex = this.nextKey1Index;

    let nextChords: Chord[];
    let nextKey1: string = '';

    if (this.nextChordTasks.length) {
      nextChords = this.nextChordTasks;
      nextKey1 = nextChords[0].chord;
    } else {
      nextChords = this.getNextChords(this.currentKeyIndex);
      nextKey1 = nextChords[0].chord;

      while (nextKey1 === this.currKey()) {
        nextChords = this.getNextChords(this.currentKeyIndex);
        nextKey1 = nextChords[0].chord;
      }
    }

    let nextKey1Index = nextChords[0].index;
    nextKey1 = nextKey1.replace(/(\*)([0-9a-z()\#]+)(\*)/g, '<sup>$2</sup>');

    this.nextKey1.set(nextKey1);
    this.nextKey1Index = nextKey1Index;

    if (nextChords.length > 1) {
      this.nextChordTasks = nextChords.slice(1);
    } else {
      this.nextChordTasks = [];
    }

    const chords = nextKey1.split('-').map((chord) => chord.trim());

    if (chords.length === 1) {
      const key = chords[0].match(this.keyRegex)?.[0] ?? '';
      this.toneService.nextBarRoot = [key, key, key, key];
      this.toneService.walking = false;
    } else if (chords.length === 2) {
      const key0 = chords[0].match(this.keyRegex)?.[0] ?? '';
      const key1 = chords[1].match(this.keyRegex)?.[0] ?? '';
      this.toneService.nextBarRoot = [key0, key0, key1, key1];
      this.toneService.walking = false;
    } else if (chords.length === 3) {
      const key0 = chords[0].match(this.keyRegex)?.[0] ?? '';
      const key1 = chords[1].match(this.keyRegex)?.[0] ?? '';
      const key2 = chords[2].match(this.keyRegex)?.[0] ?? '';
      this.toneService.nextBarRoot = [key0, key1, key2, key2];
      this.toneService.walking = true;
    } else if (chords.length === 4) {
      const key0 = chords[0].match(this.keyRegex)?.[0] ?? '';
      const key1 = chords[1].match(this.keyRegex)?.[0] ?? '';
      const key2 = chords[2].match(this.keyRegex)?.[0] ?? '';
      const key3 = chords[3].match(this.keyRegex)?.[0] ?? '';
      this.toneService.nextBarRoot = [key0, key1, key2, key3];
      this.toneService.walking = true;
    } else {
      this.toneService.nextBarRoot = ['empty', 'empty', 'empty', 'empty'];
    }
  }

  private getNextChords(currentKeyIndex: number): Chord[] {
    let key = this.keys[currentKeyIndex];
    let keyIndex = 0;

    while (key === this.keys[currentKeyIndex]) {
      if (this.selectedMode() === 'R') {
        // Random mode
        const probabilityIndex = Math.floor(
          Math.random() * this.probabilityCount,
        );
        keyIndex = this.probabilityMap[probabilityIndex];
      } else if (this.selectedMode() === 'WC') {
        // Weighted Cycle mode
        while (this.cycleKeys.length === 0) {
          this.cycle++;
          this.cycleKeys = this.keysConfiguration.keys
            .filter((key) => this.cycle % key.rating === 0)
            .map((key) => key.key);
        }

        console.log('cycle', this.cycle, 'keys', this.cycleKeys);

        const key =
          this.cycleKeys[Math.floor(Math.random() * this.cycleKeys.length)];
        if (key) {
          keyIndex = this.keys.indexOf(key);
          this.cycleKeys = this.cycleKeys.filter((k) => k !== key);
        }
        // TODO
      } else {
        // Other modes
        const mode = this.selectedMode() as number;

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

    let config = this.selectedExercise().configuration;
    if (!Array.isArray(config)) {
      config = config.split('||');
    }

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

    return config
      .split('|')
      .map((config) => ({ index: keyIndex, chord: config }));
  }

  openShortcuts() {
    const dialog = document.querySelector('#shortcuts') as HTMLDialogElement;
    dialog.showModal();
  }

  closeShortcuts() {
    const dialog = document.querySelector('#shortcuts') as HTMLDialogElement;
    dialog.close();
  }

  private updateProbabilityMap() {
    this.probabilityMap = {};
    this.probabilityCount = 0;

    this.keysConfiguration.keys.forEach((key, index) => {
      for (let i = 0; i < 6 - key.rating; i++) {
        this.probabilityMap[this.probabilityCount] = index;
        this.probabilityCount++;
      }
    });
  }

  private saveConfiguration() {
    if (this.initialized) {
      localStorage.setItem('tempo', this.toneService.tempo().toString());
      localStorage.setItem('mode', this.selectedMode().toString());
      localStorage.setItem('exercise', this.selectedExercise().name);
      localStorage.setItem(
        'playRootNote',
        this.toneService.playRootNote.toString(),
      );
      localStorage.setItem(
        'keysConfiguration',
        JSON.stringify(this.keysConfiguration),
      );

      this.updateProbabilityMap();
    }
  }

  private loadConfiguration() {
    this.toneService.setTempo(
      JSON.parse(localStorage.getItem('tempo') ?? '60'),
    );
    this.setExercise(
      localStorage.getItem('exercise') ?? this.exercises[0].name,
    );
    this.setMode(
      (localStorage.getItem('mode') as 'R' | 'WC' | number) ??
        this.modes[0].key,
    );
    this.toneService.playRootNote =
      localStorage.getItem('playRootNote') === 'true';

    if (localStorage.getItem('keysConfiguration')) {
      try {
        this.keysConfiguration = JSON.parse(
          localStorage.getItem('keysConfiguration') ?? '{ keys: [] }',
        );
      } catch (error) {
        this.keysConfiguration = new KeysConfiguration();
      }

      if (this.keysConfiguration.keys?.length !== this.keys.length) {
        this.keysConfiguration = new KeysConfiguration();
      }
    } else {
      this.keysConfiguration = new KeysConfiguration();
    }

    const customExercise = localStorage.getItem('customExercise');
    if (customExercise) {
      const custom = this.exercises.find((e) => e.name === 'Custom');
      if (custom) {
        custom.configuration = customExercise;
      }
    }

    this.updateProbabilityMap();
  }
}

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
import { changeLog } from 'src/app/model/change-log';
import { exercises, keys, keysSharp, modes } from 'src/app/model/configuration';
import { ToneServiceService } from 'src/app/services/tone-service.service';
import { KeysDialogComponent } from '../keys-dialog/keys-dialog.component';
import { KeysConfiguration } from 'src/app/model/keys-configuration';

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
  readonly nextKey2: WritableSignal<string | null> = signal(null);
  modes = modes;
  exercises = exercises;
  changeLog = changeLog;
  readonly selectedMode = signal('R');
  readonly isRunning = signal(false);
  readonly selectedExercise: WritableSignal<{
    name: string;
    configuration: string | string[];
    root: string[];
  }> = signal(exercises[0]);

  private currentKeyIndex = -1;
  private nextKey1Index = -1;
  private nextKey2Index = -1;
  private keys = keys;
  private keysSharp = keysSharp;
  private initialized = false;
  private keysConfiguration: KeysConfiguration = new KeysConfiguration();
  private probabilityMap: { [key: number]: number } = {};
  private probabilityCount = 0;

  constructor(
    public toneService: ToneServiceService,
    private dialog: MatDialog
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
    (<any>window).sa_event('click_start');
  }

  stop() {
    this.silentAudio.nativeElement.pause();
    this.toneService.stop();

    this.currentKeyIndex = -1;
    this.nextKey1Index = -1;
    this.nextKey2Index = -1;
    this.currKey.set(null);
    this.nextKey1.set(null);
    this.nextKey2.set(null);
    this.isRunning.set(false);
    (<any>window).sa_event('click_start');
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

  setMode(key: string) {
    if (key) {
      this.selectedMode.set(key);
      this.saveConfiguration();
    }
  }

  setExercise(name: string) {
    if (name) {
      this.selectedExercise.set(
        this.exercises.find((c) => c.name === name) ?? this.exercises[0]
      );
      this.saveConfiguration();
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

    dialogRef.afterClosed().subscribe((result) => {
      this.saveConfiguration();
    });
  }

  private updateChord(): void {
    this.currKey.set(this.nextKey1() ?? '&nbsp;');
    this.currentKeyIndex = this.nextKey1Index;

    let nextKey1 = this.nextKey2() ?? '&nbsp;';
    let nextKey1Index = this.nextKey2Index;

    while (nextKey1 === this.currKey()) {
      const nextChord = this.getNextChord(this.currentKeyIndex);
      nextKey1 = nextChord.chord;
      nextKey1Index = nextChord.index;
    }

    this.nextKey1.set(nextKey1);
    this.nextKey1Index = nextKey1Index;

    let nextChord = this.getNextChord(this.nextKey1Index);
    while (nextChord.chord === nextKey1) {
      nextChord = this.getNextChord(this.nextKey1Index);
    }

    this.nextKey2.set(nextChord.chord);
    this.nextKey2Index = nextChord.index;

    this.toneService.nextBarRoot = [this.keys[nextKey1Index]];
  }

  private getNextChord(currentKeyIndex: number): {
    index: number;
    chord: string;
  } {
    let key = this.keys[currentKeyIndex];
    let keyIndex = 0;

    while (key === this.keys[currentKeyIndex]) {
      if (this.selectedMode() === 'R') {
        const probabilityIndex = Math.floor(
          Math.random() * this.probabilityCount
        );
        keyIndex = this.probabilityMap[probabilityIndex];
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

    let config = this.selectedExercise().configuration;
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
      localStorage.setItem('mode', this.selectedMode());
      localStorage.setItem('exercise', this.selectedExercise().name);
      localStorage.setItem(
        'playRootNote',
        this.toneService.playRootNote.toString()
      );
      localStorage.setItem(
        'keysConfiguration',
        JSON.stringify(this.keysConfiguration)
      );

      this.updateProbabilityMap();
    }
  }

  private loadConfiguration() {
    this.toneService.setTempo(
      JSON.parse(localStorage.getItem('tempo') ?? '60')
    );
    this.setExercise(
      localStorage.getItem('exercise') ?? this.exercises[0].name
    );
    this.setMode(localStorage.getItem('mode') ?? this.modes[0].key);
    this.toneService.playRootNote =
      localStorage.getItem('playRootNote') === 'true';

    if (localStorage.getItem('keysConfiguration')) {
      try {
        this.keysConfiguration = JSON.parse(
          localStorage.getItem('keysConfiguration') ?? '{ keys: [] }'
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

    this.updateProbabilityMap();
  }
}

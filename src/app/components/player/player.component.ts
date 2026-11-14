import {
  AfterViewInit,
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
  untracked,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { exercises, keys, keysSharp, modes } from 'src/app/model/configuration';
import { ToneService } from 'src/app/services/tone.service';
import { KeysDialogComponent } from '../keys-dialog/keys-dialog.component';
import { KeysConfiguration } from 'src/app/model/keys-configuration';

type Chord = {
  index: number;
  chord: string;
};

/** Half steps from the root for each scale degree of a major scale. */
const degreeSteps: Record<string, number> = { I: 0, II: 2, III: 4, IV: 5, V: 7, VI: 9, VII: 11 };

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PlayerComponent implements OnInit, AfterViewInit {
  @ViewChild('silentAudio') silentAudio!: ElementRef<HTMLAudioElement>;

  /**
   * Space starts and stops practice. It acts on keydown and cancels the browser default, which
   * would otherwise scroll the page or press the button that still has focus from a mouse click.
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Tab') {
      this.focusFromPointer = false;
    }
    if (event.key !== ' ' || this.isHandledByFocusedControl(event)) {
      return;
    }

    event.preventDefault();
    if (event.repeat) {
      return;
    }

    if (this.isRunning()) {
      this.stop();
    } else {
      this.start();
    }
  }

  /**
   * Whether the focused control got its focus from a mouse or touch press rather than from Tab.
   * (:focus-visible cannot tell: Chrome turns it on as soon as a key is pressed.)
   */
  private focusFromPointer = false;

  @HostListener('document:pointerdown')
  handlePointerDown() {
    this.focusFromPointer = true;
  }

  /** Arrow keys change the tempo: Ctrl 10 BPM, Shift 5 BPM, otherwise 1 BPM. */
  @HostListener('document:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent) {
    if (event.key === ' ' && !this.isHandledByFocusedControl(event)) {
      // Keydown already toggled; a button would otherwise fire its click on keyup
      event.preventDefault();
      return;
    }

    if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && !this.isHandledByFocusedControl(event)) {
      const step = event.ctrlKey ? 10 : event.shiftKey ? 5 : 1;
      this.changeTempo(event.key === 'ArrowLeft' ? -step : step);
    }
  }

  /**
   * True when the key belongs to the focused element or an open dialog or list, so the global
   * shortcut must not fire as well (e.g. Space in a text field, arrows in an input).
   */
  private isHandledByFocusedControl(event: KeyboardEvent): boolean {
    if (document.querySelector('dialog[open], .mat-mdc-dialog-container, .mat-mdc-select-panel, .mat-mdc-menu-panel')) {
      return true;
    }

    const target = event.target instanceof Element ? event.target : null;
    if (!target) {
      return false;
    }

    // Text entry (Space types, arrows move the caret) and checkboxes (Space toggles them)
    if (target.closest('input, textarea, select, [contenteditable="true"]')) {
      return true;
    }

    // Arrows move the selection in these widgets
    if (event.key !== ' ') {
      return !!target.closest('[role="combobox"], [role="listbox"], [role="option"], [role^="menuitem"]');
    }

    // Space on a button reached with Tab presses that button. A button that only kept focus
    // after a mouse click would be pressed again, so then Space is the shortcut instead.
    const control = target.closest('button, [role="combobox"], [role="option"], [role^="menuitem"], [tabindex]');
    return !!control && !(control as HTMLButtonElement).disabled && !this.focusFromPointer;
  }

  minTempo = 20;
  maxTempo = 300;
  readonly currKey: WritableSignal<string | null> = signal(null);
  readonly nextKey1: WritableSignal<string | null> = signal(null);
  modes = modes;
  exercises = exercises;
  readonly selectedMode = signal<'R' | 'WC' | number>('R');
  readonly isRunning = signal(false);
  /** The last start failed because the sound could not be loaded; shown until the next start. */
  readonly audioFailed = signal(false);
  /** Number of chords in the current and the next bar (set in updateChord), used to size the text. */
  readonly chordCount = signal(1);
  readonly nextChordCount = signal(1);
  /** True during the count-in bar after start, before the first chord is shown. */
  private readonly countingIn = signal(false);
  /** 4-3-2-1 during the count-in bar. */
  readonly countdown = computed(() => {
    const beat = this.toneService.beat();
    if (!this.isRunning() || beat < 0 || !this.countingIn()) {
      return null;
    }
    return 4 - (beat % 4);
  });
  /** Shown in the next card before Start: the exercise the session will practice. */
  readonly exerciseLabel = computed(() => {
    // An en dash between chords, as on the stage
    const name = this.selectedExercise().name.replaceAll(' - ', ' – ');
    if (name === 'Custom') {
      return { text: 'Custom progression', chords: 'Custom progression', note: '' };
    }
    // The chords stay on one line; only a note like "(two bars)" may wrap below them
    const [, chords, note] = name.match(/^(.*?)(?:\s+(\([^()]*\)))?$/) ?? [name, name, ''];
    return { text: name, chords, note: note ?? '' };
  });
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
  /** Key ratings; replaced with a new object whenever they change so the piano updates. */
  private readonly keysConfiguration = signal<KeysConfiguration>(new KeysConfiguration());
  /** When false, all keys come up equally often and the ratings are ignored. */
  readonly weightKeys = signal(true);
  /** The ratings laid out as one piano octave: black keys sit on the boundary after white key `pos`. */
  readonly pianoKeys = computed(() => {
    const blackPos: Record<string, number> = { Db: 1, Eb: 2, Gb: 4, Ab: 5, Bb: 6 };
    return this.keysConfiguration().keys.map((k) => ({
      ...k,
      black: k.key in blackPos,
      pos: blackPos[k.key] ?? 0,
    }));
  });
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private probabilityMap: { [key: number]: number } = {};
  private probabilityCount = 0;
  private cycle = 0;
  private cycleKeys: string[] = [];
  private nextChordTasks: Chord[] = [];
  private readonly keyRegex = new RegExp(/^[A-H]+#?b?/);

  private readonly host = inject(ElementRef<HTMLElement>);

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

    // The type sizes per chord count fit typical bars; a long one (e.g. Bm7(b5) – E7 – Am6 or a
    // custom progression) is scaled down after rendering so it stays on one line
    afterRenderEffect(() => {
      this.currKey();
      this.nextKey1();
      this.countdown();
      const host: HTMLElement = this.host.nativeElement;
      host.querySelectorAll<HTMLElement>('#currentChord, #nextChord').forEach((bar) => this.fitBar(bar));
    });

    // Settings live in localStorage; the prerendered page shows the defaults
    if (this.isBrowser) {
      this.loadConfiguration();
    }
    this.initialized = true;
  }

  ngOnInit(): void {}

  /** Scales a bar's text down just enough to fit the content width of its card. */
  private fitBar(bar: HTMLElement) {
    bar.style.fontSize = '';
    const card = bar.parentElement;
    if (!card) {
      return;
    }
    const style = getComputedStyle(card);
    const available = card.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const needed = bar.scrollWidth;
    if (needed > available && available > 0) {
      bar.style.fontSize = `${Math.floor((available / needed) * 100) / 100}em`;
    }
  }

  ngAfterViewInit(): void {
    this.silentAudio.nativeElement.loop = true;
  }

  /**
   * index.html hides the player while the stored settings are not applied yet, so a returning
   * visitor does not see the prerendered defaults jump to their own tempo and chords.
   */
  private readonly revealSettings = afterNextRender(() => {
    document.documentElement.classList.remove('restoring-settings');
  });

  async start() {
    // Keeps the audio session alive on iOS; a refused play() must not stop practice
    this.silentAudio.nativeElement.play().catch(() => {});
    this.audioFailed.set(false);
    this.isRunning.set(true);
    this.cycle = 0;
    this.cycleKeys = [];

    // Analytics is optional: blocked or not yet loaded, it must not break Start
    try {
      (window as { sa_event?: (name: string) => void }).sa_event?.('click_start');
    } catch {}

    try {
      await this.toneService.start();
    } catch (error) {
      console.error('Audio could not start', error);
      if (this.isRunning()) {
        this.stop();
        this.audioFailed.set(true);
      }
    }
  }

  stop() {
    this.silentAudio.nativeElement.pause();
    this.toneService.stop();

    this.currentKeyIndex = -1;
    this.nextKey1Index = -1;
    this.currKey.set(null);
    this.nextKey1.set(null);
    this.chordCount.set(1);
    this.nextChordCount.set(1);
    this.countingIn.set(false);
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

  // Select the tempo on entry so typing replaces it. A click that focuses the field needs a
  // second select() because the browser places the caret on mouseup; later clicks place
  // the caret normally.
  private selectTempoOnClick = false;

  onTempoPointerDown(input: HTMLInputElement) {
    this.selectTempoOnClick = document.activeElement !== input;
  }

  onTempoFocus(input: HTMLInputElement) {
    input.select();
  }

  onTempoClick(input: HTMLInputElement) {
    if (this.selectTempoOnClick) {
      input.select();
      this.selectTempoOnClick = false;
    }
  }

  /** Applies a typed tempo, kept within 20–300 BPM; an empty or invalid entry restores the current tempo. */
  setTempo(input: HTMLInputElement) {
    const typed = Math.round(Number(input.value));
    if (input.value.trim() !== '' && Number.isFinite(typed)) {
      this.toneService.setTempo(Math.min(this.maxTempo, Math.max(this.minTempo, typed)));
      this.saveConfiguration();
    }

    // The field shows what is actually used, also when the value was clamped or rejected
    input.value = String(this.toneService.tempo());
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

  setWeightKeys(value: boolean) {
    this.weightKeys.set(value);
    this.cycleKeys = [];
    this.saveConfiguration();
  }

  openKeysDialog(): void {
    // The dialog edits the ratings in place on its own copy
    const keysConfiguration = structuredClone(this.keysConfiguration());
    const dialogRef = this.dialog.open(KeysDialogComponent, {
      data: { keysConfiguration },
    });

    dialogRef.afterClosed().subscribe(() => {
      this.keysConfiguration.set(keysConfiguration);
      this.saveConfiguration();
    });
  }

  private updateChord(): void {
    // No next chord yet means this is the count-in bar right after start
    this.countingIn.set(this.nextKey1() === null);
    this.chordCount.set(this.nextChordCount());
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
    const chords = nextKey1.split('-').map((chord) => chord.trim());

    // Each chord stays whole; an en dash separates the chords of a bar (styled in styles.scss)
    this.nextKey1.set(chords.map((chord) => `<span class="ch">${chord}</span>`).join('<span class="sep">–</span>'));
    this.nextKey1Index = nextKey1Index;

    if (nextChords.length > 1) {
      this.nextChordTasks = nextChords.slice(1);
    } else {
      this.nextChordTasks = [];
    }

    this.nextChordCount.set(chords.length);

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
          this.cycleKeys = this.keysConfiguration().keys
            .filter((key) => this.cycle % this.keyWeight(key.rating) === 0)
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
        // Interval modes: the mode key is the step in semitones, stored as a
        // string ('5', '-5'), so convert it before doing arithmetic with it.
        const mode = Number(this.selectedMode());
        if (!Number.isInteger(mode) || mode % this.keys.length === 0) {
          // An unusable step would never reach a new key; fall back to random.
          this.selectedMode.set('R');
          continue;
        }

        // Start on C: the first step lands on index 0.
        const fromIndex = currentKeyIndex === -1 ? -mode : currentKeyIndex;
        const length = this.keys.length;
        keyIndex = (((fromIndex + mode) % length) + length) % length;
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

    config = this.resolveNumerals(config, keyIndex, keys);

    return config
      .split('|')
      .map((config) => ({ index: keyIndex, chord: config }));
  }


  /**
   * Replaces the Roman numerals (I–VII, a trailing b lowers them a half step) with the note names
   * of the key. Chord types between asterisks are kept as written, so 'dim' or 'sus' stay intact.
   */
  private resolveNumerals(config: string, keyIndex: number, keys: string[]): string {
    return config
      .split(/(\*[^*]*\*)/)
      .map((part) =>
        part.startsWith('*')
          ? part
          : // Longest numerals first, so VII is not read as V + II
            part.replace(/(VII|VI|V|IV|III|II|I)(b?)/gi, (_, numeral: string, flat: string) => {
              const step = degreeSteps[numeral.toUpperCase()] - (flat ? 1 : 0);
              return keys[(keyIndex + step + 12) % 12];
            }),
      )
      .join('');
  }

  /** Weighted cycle: a key with rating r appears every r-th cycle; unweighted: every cycle. */
  private keyWeight(rating: number): number {
    return this.weightKeys() ? rating : 1;
  }

  private updateProbabilityMap() {
    this.probabilityMap = {};
    this.probabilityCount = 0;

    this.keysConfiguration().keys.forEach((key, index) => {
      // Rating 1 (unfamiliar) gets 5 tickets, rating 5 gets 1; unweighted: 1 each
      const tickets = this.weightKeys() ? 6 - key.rating : 1;
      for (let i = 0; i < tickets; i++) {
        this.probabilityMap[this.probabilityCount] = index;
        this.probabilityCount++;
      }
    });
  }

  private saveConfiguration() {
    if (this.initialized && this.isBrowser) {
      localStorage.setItem('tempo', this.toneService.tempo().toString());
      localStorage.setItem('mode', this.selectedMode().toString());
      localStorage.setItem('exercise', this.selectedExercise().name);
      localStorage.setItem(
        'playRootNote',
        this.toneService.playRootNote.toString(),
      );
      localStorage.setItem('weightKeys', this.weightKeys().toString());
      localStorage.setItem(
        'keysConfiguration',
        JSON.stringify(this.keysConfiguration()),
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
    const storedMode = localStorage.getItem('mode');
    this.setMode(
      (this.modes.find((m) => m.key === storedMode)?.key ??
        this.modes[0].key) as 'R' | 'WC' | number,
    );
    this.toneService.playRootNote =
      localStorage.getItem('playRootNote') === 'true';
    this.weightKeys.set(localStorage.getItem('weightKeys') !== 'false');

    let keysConfiguration = new KeysConfiguration();
    const storedKeys = localStorage.getItem('keysConfiguration');
    if (storedKeys) {
      try {
        const parsed: KeysConfiguration = JSON.parse(storedKeys);
        if (parsed.keys?.length === this.keys.length) {
          keysConfiguration = parsed;
        }
      } catch (error) {
        // keep the default configuration
      }
    }
    this.keysConfiguration.set(keysConfiguration);

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

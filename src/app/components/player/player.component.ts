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
import {
  bassLine,
  chordToHtml,
  ChordSequence,
  CUSTOM_EXERCISE,
  DEFAULT_CUSTOM_PROGRESSION,
  defaultKeyRatings,
  EXERCISES,
  findExercise,
  isKeyOrder,
  KEY_ORDERS,
  parseKeyRatings,
  type ChordSequenceOptions,
  type Exercise,
  type KeyOrder,
  type KeyRatings,
} from 'src/app/chord-engine';
import { ToneService } from 'src/app/services/tone.service';
import { KeysDialogComponent } from '../keys-dialog/keys-dialog.component';

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
  modes = KEY_ORDERS;
  exercises = EXERCISES;
  readonly selectedMode = signal<KeyOrder>('R');
  readonly isRunning = signal(false);
  /** The last start failed because the sound could not be loaded; shown until the next start. */
  readonly audioFailed = signal(false);
  /** Number of chords in the current and the next bar (set in updateChord), used to size the text. */
  readonly chordCount = signal(1);
  readonly nextChordCount = signal(1);
  /** True during the count-in bar after start, before the first chord is shown. */
  private readonly countingIn = signal(false);
  /** The beat pulse lasts 260 ms, or 60% of a beat at fast tempos, so it settles before the next click. */
  readonly beatPulse = computed(() => `${Math.round(Math.min(260, (0.6 * 60000) / this.toneService.tempo()))}ms`);
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
    if (name === CUSTOM_EXERCISE) {
      return { text: 'Custom progression', chords: 'Custom progression', note: '' };
    }
    // The chords stay on one line; only a note like "(two bars)" may wrap below them
    const [, chords, note] = name.match(/^(.*?)(?:\s+(\([^()]*\)))?$/) ?? [name, name, ''];
    return { text: name, chords, note: note ?? '' };
  });
  readonly selectedExercise: WritableSignal<Exercise> = signal(EXERCISES[0]);
  /** The progression of the Custom exercise, as the user wrote it. */
  readonly customProgression = signal(DEFAULT_CUSTOM_PROGRESSION);

  private initialized = false;
  /** Key ratings; replaced with a new object whenever they change so the piano updates. */
  private readonly keysConfiguration = signal<KeyRatings>(defaultKeyRatings());
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
  /** Hands out the bars; it reads the current settings before every bar. */
  private readonly sequence = new ChordSequence(this.sequenceOptions());

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
      this.playHandoff();
    });

    // Settings live in localStorage; the prerendered page shows the defaults
    if (this.isBrowser) {
      this.loadConfiguration();
    }
    this.initialized = true;
  }

  ngOnInit(): void {}

  /** Where the chord stood in the next card before the bar change, for the handoff animation. */
  private handoff: { from: DOMRect; ink: string } | null = null;

  /**
   * The bar change: the chord travels from the next card onto the stage, growing and taking on the
   * stage color, then the new next chord slides up into its card. Runs after fitBar, so the
   * stage size is final. With reduced motion, both simply fade in.
   */
  private playHandoff() {
    const handoff = this.handoff;
    this.handoff = null;
    const host: HTMLElement = this.host.nativeElement;
    const stage = host.querySelector<HTMLElement>('#currentChord');
    const next = host.querySelector<HTMLElement>('#nextChord');
    if (!handoff || !stage || !next) {
      return;
    }

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      stage.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 120 });
      next.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 });
      return;
    }

    const { from, ink } = handoff;
    const to = stage.getBoundingClientRect();
    if (!from.height || !to.height) {
      return;
    }
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const scale = from.height / to.height;
    const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';
    stage.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, color: ink },
        { transform: 'none', color: getComputedStyle(stage).color },
      ],
      { duration: 240, easing: ease },
    );
    next.animate(
      [
        { transform: 'translateY(115%)', opacity: 0 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 220, delay: 40, easing: ease, fill: 'backwards' },
    );
  }

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
    // A new session starts with a new key, not with the rest of the last session's progression
    this.sequence.reset();

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
    this.handoff = null;
    this.silentAudio.nativeElement.pause();
    this.toneService.stop();

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

  setMode(key: KeyOrder) {
    if (key) {
      this.selectedMode.set(key);
      this.saveConfiguration();
    }
  }

  setExercise(name: string) {
    if (name) {
      this.selectedExercise.set(findExercise(name) ?? EXERCISES[0]);
      this.saveConfiguration();
    }
  }

  setCustomExercise(config: Event) {
    const customExercise = (<HTMLTextAreaElement>config.target).value;
    this.customProgression.set(customExercise);
    localStorage.setItem('customExercise', customExercise);
  }

  setPlayRootNote(value: boolean) {
    this.toneService.playRootNote = value;
    this.saveConfiguration();
  }

  setWeightKeys(value: boolean) {
    this.weightKeys.set(value);
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
    // The chord moves from the next card onto the stage: measure where it starts before the change
    // (also for the first chord after the count-in; not when the count-in begins)
    const nextBar =
      this.isBrowser && this.nextKey1() !== null
        ? (this.host.nativeElement.querySelector('#nextChord') as HTMLElement | null)
        : null;
    this.handoff = nextBar ? { from: nextBar.getBoundingClientRect(), ink: getComputedStyle(nextBar).color } : null;

    // No next chord yet means this is the count-in bar right after start
    this.countingIn.set(this.nextKey1() === null);
    this.chordCount.set(this.nextChordCount());
    this.currKey.set(this.nextKey1() ?? '');

    this.sequence.configure(this.sequenceOptions());
    const bar = this.sequence.next();

    // Each chord stays whole; an en dash separates the chords of a bar (styled in styles.scss)
    this.nextKey1.set(
      bar.chords.map((chord) => `<span class="ch">${chordToHtml(chord)}</span>`).join('<span class="sep">–</span>'),
    );
    this.nextChordCount.set(Math.max(1, bar.chords.length));

    const bass = bassLine(bar);
    this.toneService.nextBarRoot = bass.roots;
    this.toneService.walking = bass.walking;
  }

  /** The settings the chord sequence uses for the next bar. */
  private sequenceOptions(): ChordSequenceOptions {
    const exercise = this.selectedExercise();
    return {
      progression: exercise.name === CUSTOM_EXERCISE ? this.customProgression() : exercise.progression,
      keyOrder: this.selectedMode(),
      keyRatings: this.keysConfiguration(),
      weightKeys: this.weightKeys(),
    };
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
    }
  }

  private loadConfiguration() {
    this.toneService.setTempo(
      JSON.parse(localStorage.getItem('tempo') ?? '60'),
    );
    this.setExercise(localStorage.getItem('exercise') ?? EXERCISES[0].name);
    const storedMode = localStorage.getItem('mode') ?? '';
    this.setMode(isKeyOrder(storedMode) ? storedMode : KEY_ORDERS[0].key);
    this.toneService.playRootNote =
      localStorage.getItem('playRootNote') === 'true';
    this.weightKeys.set(localStorage.getItem('weightKeys') !== 'false');

    this.keysConfiguration.set(parseKeyRatings(localStorage.getItem('keysConfiguration')));

    const customExercise = localStorage.getItem('customExercise');
    if (customExercise) {
      this.customProgression.set(customExercise);
    }
  }
}

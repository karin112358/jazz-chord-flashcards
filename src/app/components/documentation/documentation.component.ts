import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

interface DocSection {
  id: string;
  title: string;
  /** Set for subsections: the id of the section they belong to. */
  parent?: string;
}

@Component({
  selector: 'app-documentation',
  imports: [MatIconModule],
  templateUrl: './documentation.component.html',
  styleUrl: './documentation.component.scss',
})
export class DocumentationComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  /** Contents of the page, in reading order; ids match the section elements. */
  readonly sections: DocSection[] = [
    { id: 'getting-started', title: 'Getting started' },
    { id: 'practice-screen', title: 'The practice screen' },
    { id: 'tempo', title: 'Tempo' },
    { id: 'chords', title: 'Chords' },
    { id: 'custom', title: 'Custom progressions', parent: 'chords' },
    { id: 'key-order', title: 'Key order' },
    { id: 'key-ratings', title: 'Key ratings' },
    { id: 'root-note', title: 'Root note' },
    { id: 'shortcuts', title: 'Keyboard shortcuts' },
    { id: 'settings', title: 'Settings and appearance' },
    { id: 'tips', title: 'Practice tips' },
    { id: 'feedback', title: 'Feedback' },
  ];

  /** Scale degrees for custom progressions, with their notes in C. */
  readonly degrees = ['I', 'IIb', 'II', 'IIIb', 'III', 'IV', 'Vb', 'V', 'VIb', 'VI', 'VIIb', 'VII'].map(
    (numeral, i) => ({ numeral, note: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'][i] }),
  );

  /** The section being read, highlighted in the contents. */
  readonly activeId = signal(this.sections[0].id);
  readonly activeTitle = computed(() => this.sections.find((s) => s.id === this.activeId())?.title ?? '');

  /** Small screens: the contents are folded behind a button. */
  readonly navOpen = signal(false);

  /** After a click on a link the scroll position follows that link, so the spy keeps it active. */
  private spyPausedUntil = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      let frame = 0;
      const onScroll = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => this.updateActiveFromScroll());
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      destroyRef.onDestroy(() => {
        cancelAnimationFrame(frame);
        window.removeEventListener('scroll', onScroll);
      });

      const id = decodeURIComponent(location.hash.slice(1));
      if (this.sections.some((s) => s.id === id)) {
        this.go(id, null, false);
      }
    });
  }

  /** Scrolls to a section and keeps its address in the URL. */
  go(id: string, event: Event | null, smooth = true) {
    event?.preventDefault();
    this.navOpen.set(false);
    this.activeId.set(id);
    this.spyPausedUntil = performance.now() + 1000;
    // A bare '#id' would resolve against the base href ('/') and point at the practice page
    history.replaceState(history.state, '', `${location.pathname}#${id}`);

    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.host.nativeElement
      .querySelector(`#${id}`)
      ?.scrollIntoView({ behavior: smooth && !reduceMotion ? 'smooth' : 'auto', block: 'start' });
  }

  /** The last section whose heading has passed the top fifth of the area below the menu. */
  private updateActiveFromScroll() {
    if (performance.now() < this.spyPausedUntil) {
      return;
    }

    const page = document.documentElement;
    if (window.scrollY + window.innerHeight >= page.scrollHeight - 4) {
      this.activeId.set(this.sections[this.sections.length - 1].id);
      return;
    }

    const menuBottom = document.querySelector('nav')?.getBoundingClientRect().bottom ?? 0;
    const line = menuBottom + (window.innerHeight - menuBottom) * 0.2;
    let active = this.sections[0].id;
    for (const section of this.sections) {
      const element = this.host.nativeElement.querySelector(`#${section.id}`);
      if (element && element.getBoundingClientRect().top <= line) {
        active = section.id;
      }
    }
    this.activeId.set(active);
  }
}

import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type Theme = 'system' | 'light' | 'dark';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent {
  title = 'jazz-chord-flashcards';

  isMobile = signal(false);

  readonly themeOptions: { id: Theme; label: string; icon: string }[] = [
    { id: 'system', label: 'System', icon: 'brightness_auto' },
    { id: 'light', label: 'Light', icon: 'light_mode' },
    { id: 'dark', label: 'Dark', icon: 'dark_mode' },
  ];
  theme = signal<Theme>('system');
  currentTheme = computed(() => this.themeOptions.find((o) => o.id === this.theme())!);

  private readonly root = inject(DOCUMENT).documentElement;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private destroyRef: DestroyRef
  ) {
    this.breakpointObserver
      .observe([Breakpoints.XSmall])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.breakpointObserver.isMatched(Breakpoints.XSmall)) {
          this.isMobile.set(true);
        } else {
          this.isMobile.set(false);
        }
      });

    // index.html applies the stored theme before first paint; sync the menu state with it.
    afterNextRender(() => {
      const stored = this.root.getAttribute('data-theme');
      if (stored === 'light' || stored === 'dark') {
        this.theme.set(stored);
      }
    });
  }

  setTheme(theme: Theme) {
    this.theme.set(theme);
    if (theme === 'system') {
      this.root.removeAttribute('data-theme');
    } else {
      this.root.setAttribute('data-theme', theme);
    }
    try {
      if (theme === 'system') {
        localStorage.removeItem('theme');
      } else {
        localStorage.setItem('theme', theme);
      }
    } catch {}
  }
}

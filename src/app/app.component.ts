import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SeoService } from './services/seo.service';

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

    // Title, description, canonical and structured data per page (also written into the prerendered HTML)
    const seo = inject(SeoService);
    const router = inject(Router);
    router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        let route = router.routerState.snapshot.root;
        while (route.firstChild) {
          route = route.firstChild;
        }
        seo.update(event.urlAfterRedirects, route.data['seo']);
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
    // The browser bar follows the chosen theme too (index.html applies the stored choice on load)
    this.root.ownerDocument.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
      const scheme = meta.dataset['scheme'];
      meta.media =
        theme === 'system' ? `(prefers-color-scheme: ${scheme})` : scheme === theme ? 'all' : 'not all';
    });
    try {
      if (theme === 'system') {
        localStorage.removeItem('theme');
      } else {
        localStorage.setItem('theme', theme);
      }
    } catch {}
  }
}

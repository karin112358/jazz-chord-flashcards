import { BreakpointObserver } from '@angular/cdk/layout';
import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, ElementRef, ViewChild, afterNextRender, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { InstallService } from './services/install.service';
import { SeoService } from './services/seo.service';

type Theme = 'system' | 'light' | 'dark';

/**
 * Below this width the links move into the burger menu. The full bar (logo, four links, Install,
 * shortcuts and appearance) needs about 880px; the margin keeps it on one line even if the font
 * renders a little wider.
 */
const COLLAPSED_MENU = '(max-width: 919.98px)';

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

  /** Install as an app: the browser's prompt, or the manual steps for Safari */
  readonly install = inject(InstallService);
  @ViewChild('installHelp') private installHelp?: ElementRef<HTMLDialogElement>;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private destroyRef: DestroyRef
  ) {
    this.breakpointObserver
      .observe(COLLAPSED_MENU)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => this.isMobile.set(state.matches));

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

  async installApp() {
    if (!(await this.install.promptInstall())) {
      this.installHelp?.nativeElement.showModal();
    }
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

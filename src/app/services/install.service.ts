import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

/** The browser's install prompt (Chrome, Edge, Android); not part of the standard DOM types. */
interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Browsers without an install prompt that can still add the app by hand. */
export type InstallHint = 'ios' | 'mac-safari';

/**
 * Which manual install steps apply. iPadOS reports itself as a Mac, but has touch points.
 * Every browser on iOS can add to the home screen through Share; on a Mac only Safari has
 * "Add to Dock". Elsewhere there is either a real prompt or no way to install.
 */
export function installHint(userAgent: string, maxTouchPoints: number): InstallHint | null {
  const isMac = /Macintosh/.test(userAgent);
  if (/iPhone|iPad|iPod/.test(userAgent) || (isMac && maxTouchPoints > 1)) {
    return 'ios';
  }
  if (isMac && /Safari\//.test(userAgent) && !/Chrome|Chromium|CriOS|Edg|Firefox|FxiOS|OPR/.test(userAgent)) {
    return 'mac-safari';
  }
  return null;
}

type InstallWindow = Window & { __installPrompt?: InstallPromptEvent; __appInstalled?: boolean };

/** Offers to install the site as an app: the browser's own prompt where there is one, steps otherwise. */
@Injectable({ providedIn: 'root' })
export class InstallService {
  private readonly prompt = signal<InstallPromptEvent | null>(null);
  private readonly installed = signal(false);
  /** Manual steps for browsers without a prompt (Safari); null where they do not apply. */
  readonly hint = signal<InstallHint | null>(null);
  /** The Install button shows while the app is not installed and installing is possible. */
  readonly visible = computed(() => !this.installed() && (this.prompt() !== null || this.hint() !== null));

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
      return;
    }
    const win = window as InstallWindow;

    // index.html keeps a prompt that arrived before the app started
    this.prompt.set(win.__installPrompt ?? null);
    addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.prompt.set(event as InstallPromptEvent);
    });

    const standalone = matchMedia('(display-mode: standalone)');
    const isStandalone = () =>
      standalone.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    this.installed.set(isStandalone() || win.__appInstalled === true);
    standalone.addEventListener('change', () => this.installed.set(isStandalone()));
    addEventListener('appinstalled', () => {
      this.installed.set(true);
      this.prompt.set(null);
    });

    this.hint.set(installHint(navigator.userAgent, navigator.maxTouchPoints));
  }

  /**
   * Shows the browser's install prompt. Returns false when there is none, so the caller shows
   * the manual steps instead.
   */
  async promptInstall(): Promise<boolean> {
    const prompt = this.prompt();
    if (!prompt) {
      return false;
    }
    // A prompt can be shown only once; the browser sends a new one if it is dismissed
    this.prompt.set(null);
    await prompt.prompt();
    await prompt.userChoice;
    return true;
  }
}

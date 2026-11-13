import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

/** Search and sharing metadata for one page. */
interface PageSeo {
  title: string;
  description: string;
  /** Extra schema.org nodes for this page, added to the WebSite node every page has. */
  structuredData?: object[];
}

const ORIGIN = 'https://practice-jazz-chords.com';
const SITE_NAME = 'Practice Jazz Chords';
const SHARE_IMAGE = `${ORIGIN}/assets/og-image.png`;

const WEB_APPLICATION = {
  '@type': 'WebApplication',
  '@id': `${ORIGIN}/#app`,
  name: SITE_NAME,
  url: `${ORIGIN}/`,
  description:
    'Free jazz chord flashcards in the browser: one bar of chords at a time, in tempo, in all 12 keys. ' +
    'Practice maj7, m7 and 7 chords, ii–V–I and other progressions or your own, with a count-in and a click.',
  applicationCategory: 'EducationalApplication',
  applicationSubCategory: 'Music practice',
  operatingSystem: 'Any (web browser)',
  browserRequirements: 'Requires JavaScript and Web Audio',
  inLanguage: 'en',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  image: SHARE_IMAGE,
  featureList: [
    'Chord symbols in all 12 keys, one bar at a time in tempo',
    'Major 7, minor 7 and dominant 7 chords',
    'ii–V–I, minor ii–V–i and I–vi–ii–V progressions in one or two bars',
    'Custom chord progressions written in Roman numerals',
    'Key orders: random, weighted cycle, perfect fourths up and down',
    'Key ratings so unfamiliar keys come up more often',
    'One-bar count-in, metronome click and optional root note',
    'Keyboard shortcuts, light and dark mode',
  ],
};

/**
 * Pages by path. Titles and descriptions are what search results and link previews show;
 * the structured data describes the app to search engines and AI tools.
 */
const PAGES: Record<string, PageSeo> = {
  '/': {
    title: 'Practice Jazz Chords – Jazz chord flashcards in all 12 keys',
    description:
      'Free jazz chord trainer in the browser. Play one bar of chords at a time in tempo, in all 12 keys: ' +
      'maj7, m7 and 7 chords, ii–V–I and your own progressions, with extra practice for unfamiliar keys.',
    structuredData: [WEB_APPLICATION],
  },
  '/documentation': {
    title: 'Documentation – Practice Jazz Chords',
    description:
      'How Practice Jazz Chords works: starting a session, tempo, chord exercises, writing custom ' +
      'progressions in Roman numerals, key order, key ratings, root note and keyboard shortcuts.',
    structuredData: [
      {
        '@type': 'TechArticle',
        headline: 'Practice Jazz Chords documentation',
        description:
          'Guide to every setting of Practice Jazz Chords, including the syntax for custom chord progressions.',
        url: `${ORIGIN}/documentation/`,
        inLanguage: 'en',
        about: { '@id': `${ORIGIN}/#app` },
      },
      {
        '@type': 'HowTo',
        name: 'Start a jazz chord practice session',
        step: [
          { '@type': 'HowToStep', text: 'Pick what to practice under Chords, for example Major 7 or a ii–V–I.' },
          { '@type': 'HowToStep', text: 'Set a tempo you can play cleanly; 60 BPM is a good start.' },
          { '@type': 'HowToStep', text: 'Press Start or Space. The app counts in 4 3 2 1 over one bar of clicks.' },
          { '@type': 'HowToStep', text: 'Play the chord under "play" and glance at "next" to get ready for the coming bar.' },
        ],
      },
    ],
  },
  '/change-log': {
    title: 'Change Log – Practice Jazz Chords',
    description: 'What changed in Practice Jazz Chords, newest first.',
  },
  '/contact': {
    title: 'Contact – Practice Jazz Chords',
    description: 'Ideas, questions or a bug to report? Contact Practice Jazz Chords by email or on GitHub.',
  },
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  /** Applies the metadata for a router URL; unknown paths are marked noindex. Runs during prerendering too. */
  update(url: string) {
    const path = url.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
    const page = PAGES[path];

    if (!page) {
      this.meta.updateTag({ name: 'robots', content: 'noindex' });
      this.setCanonical(null);
      return;
    }

    // GitHub Pages serves the prerendered pages as folders, so their final URLs end in a slash
    const canonical = path === '/' ? `${ORIGIN}/` : `${ORIGIN}${path}/`;

    this.title.setTitle(page.title);
    this.meta.removeTag('name="robots"');
    this.meta.updateTag({ name: 'description', content: page.description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:title', content: page.title });
    this.meta.updateTag({ property: 'og:description', content: page.description });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:image', content: SHARE_IMAGE });
    this.meta.updateTag({ property: 'og:image:width', content: '1200' });
    this.meta.updateTag({ property: 'og:image:height', content: '630' });
    this.meta.updateTag({ property: 'og:image:alt', content: 'Practice Jazz Chords logo: a flashcard with the chord symbol C7' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.setCanonical(canonical);
    this.setStructuredData([
      { '@type': 'WebSite', '@id': `${ORIGIN}/#website`, name: SITE_NAME, url: `${ORIGIN}/`, inLanguage: 'en' },
      ...(page.structuredData ?? []),
    ]);
  }

  private setCanonical(href: string | null) {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!href) {
      link?.remove();
      return;
    }
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = href;
  }

  private setStructuredData(nodes: object[]) {
    let script = this.document.head.querySelector<HTMLScriptElement>('script#structured-data');
    if (!script) {
      script = this.document.createElement('script');
      script.id = 'structured-data';
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes });
  }
}

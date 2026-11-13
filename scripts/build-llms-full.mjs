// Writes llms-full.txt (the documentation as Markdown, for AI tools) from the prerendered
// documentation page, so it always matches what the site shows. Runs after `ng build`.
import { readFileSync, writeFileSync } from 'node:fs';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const ORIGIN = 'https://practice-jazz-chords.com';
const browserDir = 'dist/jazz-chord-flashcards/browser';

const html = readFileSync(`${browserDir}/documentation/index.html`, 'utf8');
const article = html.match(/<article[^>]*class="docs-content"[^>]*>([\s\S]*?)<\/article>/)?.[1];
if (!article) {
  throw new Error('build-llms-full: no <article class="docs-content"> in documentation/index.html');
}

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
});
turndown.use(gfm);

const isInTableCell = (node) => {
  for (let parent = node.parentNode; parent; parent = parent.parentNode) {
    if (parent.nodeName === 'TD' || parent.nodeName === 'TH') return true;
  }
  return false;
};
const hasClass = (node, name) => (node.getAttribute?.('class') ?? '').split(/\s+/).includes(name);

// Pictures and icons only decorate; screen-reader text (e.g. "Left arrow" in a key) stays
turndown.remove((node) => ['FIGURE', 'MAT-ICON', 'SCRIPT', 'STYLE'].includes(node.nodeName) || node.getAttribute?.('aria-hidden') === 'true');

turndown.addRule('absoluteLinks', {
  filter: (node) => node.nodeName === 'A' && node.getAttribute('href'),
  replacement: (content, node) => {
    const href = node.getAttribute('href');
    if (href.startsWith('mailto:')) return content;
    return `[${content}](${href.startsWith('/') ? ORIGIN + href : href})`;
  },
});

// A pipe inside a table cell would end the cell
turndown.addRule('codeInTable', {
  filter: (node) => node.nodeName === 'CODE' && isInTableCell(node),
  replacement: (content) => '`' + content.replace(/\|/g, '\\|') + '`',
});
turndown.addRule('breakInTable', {
  filter: (node) => node.nodeName === 'BR' && isInTableCell(node),
  replacement: () => ', ',
});

// Definition lists become "- **term**: description"
turndown.addRule('definitionList', {
  filter: 'dl',
  replacement: (content) => `\n\n${content.trim()}\n\n`,
});
turndown.addRule('definitionTerm', {
  filter: 'dt',
  replacement: (content) => `\n- **${content.trim()}**: `,
});
turndown.addRule('definitionDescription', {
  filter: 'dd',
  replacement: (content) => content.trim(),
});

// The scale degrees are a row of numeral and note pairs; as a table they keep that pairing
turndown.addRule('degreeScale', {
  filter: (node) => node.nodeName === 'UL' && hasClass(node, 'degree-scale'),
  replacement: (_content, node) => {
    const items = Array.from(node.childNodes).filter((child) => child.nodeName === 'LI');
    const numerals = items.map((li) => li.childNodes[0]?.textContent.trim() ?? '');
    const notes = items.map((li) => li.childNodes[1]?.textContent.trim() ?? '');
    const row = (cells) => `| ${cells.join(' | ')} |`;
    return `\n\n${row(numerals)}\n${row(numerals.map(() => '---'))}\n${row(notes)}\n\n`;
  },
});

// Angular drops the space between neighbouring keys, so "← →" would read "Left arrowRight arrow"
turndown.addRule('keys', {
  filter: 'kbd',
  replacement: (content, node) => content.trim() + (node.nextSibling?.nodeName === 'KBD' ? ' / ' : ''),
});

turndown.addRule('note', {
  filter: (node) => node.nodeName === 'P' && hasClass(node, 'note'),
  replacement: (content) => `\n\nNote: ${content.trim()}\n\n`,
});

const header = `# Practice Jazz Chords – Documentation

> Free jazz chord flashcards in the browser: one bar of chords at a time, in tempo, in all 12 keys.

Website: ${ORIGIN}/
This file is the documentation from ${ORIGIN}/documentation/ as plain Markdown.
Source code: https://github.com/karin112358/jazz-chord-flashcards
`;

const body = turndown
  .turndown(article)
  .replace(/^(\s*)(-|\d+\.) +/gm, '$1$2 ') // one space after list markers
  .replace(/\n{3,}/g, '\n\n')
  .trim();
const markdown = `${header}\n${body}\n`;
writeFileSync(`${browserDir}/llms-full.txt`, markdown);
console.log(`build-llms-full: wrote ${browserDir}/llms-full.txt (${markdown.length} characters)`);

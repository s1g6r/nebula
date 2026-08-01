import { marked } from 'marked';
import { parseWikilinks } from './wikilinks';
import type { Note } from './db';

marked.setOptions({ breaks: true, gfm: true });

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function linkifyWikilinks(text: string, notesByTitleLower: Map<string, Note>): string {
  const links = parseWikilinks(text);
  if (links.length === 0) return text;
  let result = '';
  let cursor = 0;
  for (const link of links) {
    result += text.slice(cursor, link.index);
    const exists = notesByTitleLower.has(link.target.toLowerCase());
    const cls = exists ? 'wikilink' : 'wikilink broken';
    result += `<a class="${cls}" data-note-title="${escapeHtml(link.target)}">${escapeHtml(link.display)}</a>`;
    cursor = link.index + link.raw.length;
  }
  result += text.slice(cursor);
  return result;
}

/**
 * marked renders `[[...]]` as harmless literal text (it isn't valid markdown
 * syntax), including verbatim inside <code>/<pre> blocks. So we render
 * markdown first, then walk the resulting HTML and only linkify wikilinks
 * that fall outside code spans/blocks — leaving literal syntax examples like
 * `` `[[Title]]` `` untouched instead of turning them into links.
 */
export function renderNoteMarkdown(content: string, notesByTitleLower: Map<string, Note>): string {
  const html = marked.parse(content, { async: false }) as string;

  // Split on <code>...</code> and <pre>...</pre> blocks (non-greedy, dotAll)
  // so wikilinks are only linkified in the surrounding segments.
  const parts = html.split(/(<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>)/g);
  return parts
    .map((part, i) => (i % 2 === 0 ? linkifyWikilinks(part, notesByTitleLower) : part))
    .join('');
}

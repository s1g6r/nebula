import type { Note } from './db';

const WIKILINK_RE = /\[\[([^[\]|]+?)(?:\|([^[\]]+?))?\]\]/g;

export interface WikiLinkMatch {
  raw: string;
  target: string; // note title being linked to
  display: string; // text to display
  index: number;
}

export function parseWikilinks(content: string): WikiLinkMatch[] {
  const matches: WikiLinkMatch[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(WIKILINK_RE);
  while ((m = re.exec(content)) !== null) {
    matches.push({
      raw: m[0],
      target: m[1].trim(),
      display: (m[2] ?? m[1]).trim(),
      index: m.index,
    });
  }
  return matches;
}

export function extractLinkTitles(content: string): string[] {
  return Array.from(new Set(parseWikilinks(content).map((l) => l.target.toLowerCase())));
}

/** Build a map of noteId -> set of noteIds that link to it (backlinks), given all notes. */
export function buildLinkGraph(notes: Note[]) {
  const byTitleLower = new Map<string, Note>();
  for (const n of notes) byTitleLower.set(n.title.toLowerCase(), n);

  const forwardLinks = new Map<string, Set<string>>(); // noteId -> linked noteIds
  const backLinks = new Map<string, Set<string>>(); // noteId -> noteIds linking to it

  for (const n of notes) {
    const titles = extractLinkTitles(n.content);
    const targets = new Set<string>();
    for (const t of titles) {
      const target = byTitleLower.get(t);
      if (target && target.id !== n.id) {
        targets.add(target.id);
        if (!backLinks.has(target.id)) backLinks.set(target.id, new Set());
        backLinks.get(target.id)!.add(n.id);
      }
    }
    forwardLinks.set(n.id, targets);
  }

  return { forwardLinks, backLinks, byTitleLower };
}

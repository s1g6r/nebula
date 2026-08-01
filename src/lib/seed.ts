import { db, type Note } from './db';
import { v4 as uuidv4 } from 'uuid';

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

function n(partial: Partial<Note> & { title: string; content: string }): Note {
  return {
    id: uuidv4(),
    tags: [],
    isDaily: false,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

export async function seedIfEmpty() {
  // Wrapped in a single transaction so two concurrent callers (e.g. React
  // StrictMode's double effect invocation in dev) can't both observe an
  // empty store and both insert — IndexedDB serializes rw transactions on
  // the same store, so the second caller's count() will see the first's write.
  await db.transaction('rw', db.notes, async () => {
    const count = await db.notes.count();
    if (count > 0) return;

    const notes: Note[] = [
    n({
      title: 'Welcome to Nebula',
      tags: ['guide'],
      updatedAt: now,
      content: `# Welcome to Nebula ✨

Nebula is a **local-first** notes app. Everything you write stays in *this browser* — there's no server, no account, and no tracking. Your notes live in IndexedDB and work fully offline.

## The core idea

Link notes together with double brackets, like [[The Zettelkasten Method]] or [[Graph View]]. Nebula automatically:

- Turns \`[[Title]]\` into a clickable link
- Creates the note if it doesn't exist yet when you click it
- Tracks **backlinks** — see which notes mention this one, at the bottom of every note
- Visualizes every connection in the [[Graph View]]

## Try it

1. Open the **Graph** tab in the top bar to see how these starter notes connect.
2. Click any [[wikilink]] in this note to jump to it.
3. Hit **New Note** in the sidebar and try linking back to [[Welcome to Nebula]].
4. Use **Today** to open a daily note for quick capture.

Check out [[Markdown Cheatsheet]] for formatting tips, or start your own [[Getting Started Checklist]].`,
    }),
    n({
      title: 'The Zettelkasten Method',
      tags: ['guide', 'method'],
      updatedAt: now - 1000,
      content: `# The Zettelkasten Method

A note-taking system built on **atomic notes** — one idea per note — connected by explicit links rather than folders.

The core insight: knowledge compounds through *connections*, not categories. Instead of filing a note under one topic, you link it to every related idea, and let a web of thought emerge.

This pairs naturally with [[Graph View]] — the graph **is** the structure, so nothing needs a home. See also [[Welcome to Nebula]].`,
    }),
    n({
      title: 'Graph View',
      tags: ['guide', 'feature'],
      updatedAt: now - 2000,
      content: `# Graph View

Every note is a node. Every [[wikilink]] is an edge. Open the **Graph** tab to see your whole knowledge base laid out as a force-directed network.

- **Drag** nodes to rearrange them
- **Scroll** to zoom, drag the canvas to pan
- **Click** a node to jump straight to that note
- **Hover** a node to highlight its direct connections

This is especially powerful once you've written a few dozen notes — clusters and hubs start to emerge on their own, revealing ideas you didn't know were related. This is the heart of the [[The Zettelkasten Method]].`,
    }),
    n({
      title: 'Markdown Cheatsheet',
      tags: ['guide', 'reference'],
      updatedAt: now - 3000,
      content: `# Markdown Cheatsheet

**Bold**, *italic*, and \`inline code\` all work as you'd expect.

## Lists

- Bulleted item
- Another item

1. Numbered item
2. Second item

## Quotes and code

> A blockquote for emphasis or citations.

\`\`\`
a fenced code block
for snippets
\`\`\`

## Links

Regular [markdown links](https://example.com) work too, alongside [[wikilinks]] to other notes like [[Welcome to Nebula]].`,
    }),
    n({
      title: 'Getting Started Checklist',
      tags: ['guide', 'todo'],
      updatedAt: now - 4000,
      content: `# Getting Started Checklist

- [x] Read [[Welcome to Nebula]]
- [ ] Open the [[Graph View]] and explore the network
- [ ] Create your first note and link it to something
- [ ] Try the **Today** button to start a daily note
- [ ] Search for a note using the search bar in the sidebar
- [ ] Toggle dark mode from the top bar
- [ ] Install Nebula as an app (look for the install icon in your browser's address bar)

Delete this note whenever you're ready — everything here is just a starting point, stored entirely on your device.`,
    }),
    n({
      title: (() => {
        const d = new Date(now - day);
        return d.toISOString().slice(0, 10);
      })(),
      tags: ['daily'],
      isDaily: true,
      dailyDate: new Date(now - day).toISOString().slice(0, 10),
      updatedAt: now - 5000,
      content: `# Daily note

First look through [[Welcome to Nebula]] and the [[Getting Started Checklist]]. Daily notes are a good place for quick, unsorted thoughts you can link into permanent notes later.`,
      }),
    ];

    await db.notes.bulkAdd(notes);
  });
}

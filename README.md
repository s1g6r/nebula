# Nebula

A local-first, privacy-respecting personal knowledge base — write markdown notes, link them together with `[[wikilinks]]`, and see the whole web of ideas in an interactive graph. No account, no server, no tracking: everything lives in your browser's IndexedDB and works fully offline.

**Live: https://s1g6r.github.io/nebula/**

## Features

- **Markdown notes** with a write / split / preview editor
- **`[[Wikilinks]]`** — link notes by title; linking to a note that doesn't exist yet creates it on click
- **Backlinks** — every note shows what links to it ("Linked mentions")
- **Graph view** — a force-directed, pannable/zoomable canvas graph of every note and connection, built with `d3-force`
- **Tags** — add tags to notes and filter the sidebar by tag
- **Daily notes** — one click opens (or creates) today's note
- **Full-text search** across titles, content, and tags
- **Dark mode**, persisted across sessions
- **Installable PWA** — works offline, add to home screen / dock
- **100% local** — all data stored in IndexedDB via [Dexie](https://dexie.org/); nothing ever leaves your browser

## Tech stack

- [Vite](https://vitejs.dev/) + React + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Dexie](https://dexie.org/) (IndexedDB wrapper) + `dexie-react-hooks` for reactive queries
- [marked](https://marked.js.org/) for markdown rendering
- [d3-force](https://github.com/d3/d3-force) for the graph layout, rendered on `<canvas>`
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) for offline support and installability

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # type-checks then builds to dist/
npm run preview # serve the production build locally
```

## Deployment

Static site, deployed to GitHub Pages from the `gh-pages` branch:

```bash
npm run build
npx gh-pages -d dist
```

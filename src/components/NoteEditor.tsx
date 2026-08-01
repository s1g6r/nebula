import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Pencil, Columns2, Tag as TagIcon, X } from 'lucide-react';
import type { Note } from '../lib/db';
import { renderNoteMarkdown } from '../lib/markdown';
import { buildLinkGraph } from '../lib/wikilinks';
import { updateNote } from '../hooks/useNotes';

type Mode = 'write' | 'preview' | 'split';

interface NoteEditorProps {
  note: Note;
  allNotes: Note[];
  onNavigateToTitle: (title: string) => void;
}

export function NoteEditor({ note, allNotes, onNavigateToTitle }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tagInput, setTagInput] = useState('');
  const [mode, setMode] = useState<Mode>('split');
  const previewRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset local state whenever a different note is opened.
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
  }, [note.id]);

  // Debounced autosave.
  useEffect(() => {
    if (title === note.title && content === note.content) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateNote(note.id, { title: title.trim() || 'Untitled', content });
    }, 350);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content]);

  const { byTitleLower, backLinks } = useMemo(() => buildLinkGraph(allNotes), [allNotes]);

  const html = useMemo(() => renderNoteMarkdown(content, byTitleLower), [content, byTitleLower]);

  const backlinkNotes = useMemo(() => {
    const ids = backLinks.get(note.id);
    if (!ids) return [];
    return allNotes.filter((n) => ids.has(n.id));
  }, [backLinks, note.id, allNotes]);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a.wikilink') as HTMLElement | null;
      if (target) {
        e.preventDefault();
        const t = target.dataset.noteTitle;
        if (t) onNavigateToTitle(t);
      }
    };
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, [html, onNavigateToTitle]);

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t || note.tags.includes(t)) {
      setTagInput('');
      return;
    }
    updateNote(note.id, { tags: [...note.tags, t] });
    setTagInput('');
  }

  function removeTag(t: string) {
    updateNote(note.id, { tags: note.tags.filter((x) => x !== t) });
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-4 pb-2 shrink-0">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="flex-1 text-2xl font-bold bg-transparent focus:outline-none text-gray-900 dark:text-gray-50 placeholder:text-gray-300 dark:placeholder:text-gray-600"
        />
        <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-lg p-0.5 shrink-0">
          {(
            [
              ['write', Pencil],
              ['split', Columns2],
              ['preview', Eye],
            ] as const
          ).map(([m, Icon]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center justify-center w-8 h-7 rounded-md transition-colors ${
                mode === m
                  ? 'bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title={m}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-5 pb-3 flex-wrap shrink-0">
        <TagIcon size={12} className="text-gray-400" />
        {note.tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300"
          >
            #{t}
            <button onClick={() => removeTag(t)} className="hover:text-red-500">
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addTag();
          }}
          onBlur={addTag}
          placeholder="add tag…"
          className="text-[11px] bg-transparent focus:outline-none placeholder:text-gray-400 w-20"
        />
      </div>

      <div className="flex-1 flex overflow-hidden px-5 pb-5 gap-4">
        {(mode === 'write' || mode === 'split') && (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing… use [[Note Title]] to link other notes."
            spellCheck={false}
            className={`${mode === 'split' ? 'w-1/2' : 'flex-1'} h-full resize-none bg-transparent focus:outline-none font-mono text-[13.5px] leading-relaxed text-gray-800 dark:text-gray-200 placeholder:text-gray-400`}
          />
        )}
        {mode === 'split' && <div className="w-px bg-black/10 dark:bg-white/10" />}
        {(mode === 'preview' || mode === 'split') && (
          <div className={`${mode === 'split' ? 'w-1/2' : 'flex-1'} h-full overflow-y-auto`}>
            <div
              ref={previewRef}
              className="prose-note text-[14.5px] text-gray-800 dark:text-gray-200"
              dangerouslySetInnerHTML={{ __html: html || '<p class="text-gray-400">Nothing to preview yet.</p>' }}
            />
            {backlinkNotes.length > 0 && (
              <div className="mt-8 pt-4 border-t border-black/10 dark:border-white/10">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  Linked mentions ({backlinkNotes.length})
                </div>
                <div className="flex flex-col gap-1">
                  {backlinkNotes.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => onNavigateToTitle(b.title)}
                      className="text-left text-[13px] px-2.5 py-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-violet-600 dark:text-violet-400"
                    >
                      {b.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

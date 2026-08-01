import { useMemo, useState } from 'react';
import { Search, Plus, Trash2, X } from 'lucide-react';
import type { Note } from '../lib/db';
import { searchNotes, allTags } from '../hooks/useNotes';

interface SidebarProps {
  notes: Note[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = 60 * 1000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (diff < min) return 'just now';
  if (diff < hr) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hr)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function Sidebar({ notes, selectedId, onSelect, onCreate, onDelete }: SidebarProps) {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const tags = useMemo(() => allTags(notes), [notes]);

  const filtered = useMemo(() => {
    let result = searchNotes(notes, query);
    if (activeTag) result = result.filter((n) => n.tags.includes(activeTag));
    return result;
  }, [notes, query, activeTag]);

  return (
    <div className="w-72 shrink-0 border-r border-black/10 dark:border-white/10 flex flex-col h-full bg-gray-50/60 dark:bg-white/[0.02]">
      <div className="p-3 flex flex-col gap-2 border-b border-black/5 dark:border-white/5">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes…"
            className="w-full pl-8 pr-7 py-1.5 text-[13px] rounded-md bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-violet-400/50 placeholder:text-gray-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <button
          onClick={onCreate}
          className="flex items-center justify-center gap-1.5 text-[13px] font-medium py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-white transition-colors"
        >
          <Plus size={14} /> New Note
        </button>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTag(activeTag === t ? null : t)}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                  activeTag === t
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'border-black/10 dark:border-white/15 text-gray-500 dark:text-gray-400 hover:border-violet-400'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {filtered.length === 0 && (
          <div className="text-[13px] text-gray-400 text-center px-4 py-8">No notes found.</div>
        )}
        {filtered.map((n) => (
          <div
            key={n.id}
            onClick={() => onSelect(n.id)}
            className={`group mx-2 my-0.5 px-3 py-2 rounded-md cursor-pointer transition-colors ${
              selectedId === n.id
                ? 'bg-violet-100 dark:bg-violet-500/15'
                : 'hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-[13.5px] font-medium truncate text-gray-900 dark:text-gray-100">
                {n.title || 'Untitled'}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${n.title}"? This cannot be undone.`)) onDelete(n.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity shrink-0"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="text-[11.5px] text-gray-400 truncate mt-0.5">
              {n.content.replace(/[#*`\[\]]/g, '').slice(0, 60) || 'Empty note'}
            </div>
            <div className="text-[10.5px] text-gray-400 mt-1">{relativeTime(n.updatedAt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

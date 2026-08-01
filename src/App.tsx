import { useEffect, useState } from 'react';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { NoteEditor } from './components/NoteEditor';
import { GraphView } from './components/GraphView';
import { useAllNotes, createNote, deleteNote, findNoteByTitle, getOrCreateDailyNote } from './hooks/useNotes';
import { useTheme } from './hooks/useTheme';
import { seedIfEmpty } from './lib/seed';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<'notes' | 'graph'>('notes');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const { theme, toggleTheme } = useTheme();
  const notes = useAllNotes();

  useEffect(() => {
    seedIfEmpty().finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready && notes && notes.length > 0 && !selectedId) {
      setSelectedId(notes[0].id);
    }
  }, [ready, notes, selectedId]);

  async function handleCreate() {
    const note = await createNote({ title: 'Untitled' });
    setSelectedId(note.id);
    setView('notes');
  }

  async function handleDelete(id: string) {
    await deleteNote(id);
    if (selectedId === id) setSelectedId(undefined);
  }

  async function handleNavigateToTitle(title: string) {
    const existing = await findNoteByTitle(title);
    if (existing) {
      setSelectedId(existing.id);
    } else {
      const created = await createNote({ title });
      setSelectedId(created.id);
    }
    setView('notes');
  }

  async function handleOpenToday() {
    const note = await getOrCreateDailyNote(todayKey());
    setSelectedId(note.id);
    setView('notes');
  }

  const selectedNote = notes?.find((n) => n.id === selectedId);

  if (!ready || !notes) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-white dark:bg-[#0b0e1a] text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-white dark:bg-[#0b0e1a] text-gray-900 dark:text-gray-100 overflow-hidden">
      <TopBar
        view={view}
        onViewChange={setView}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenToday={handleOpenToday}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          notes={notes}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setView('notes');
          }}
          onCreate={handleCreate}
          onDelete={handleDelete}
        />
        {view === 'graph' ? (
          <GraphView
            notes={notes}
            isDark={theme === 'dark'}
            onSelect={(id) => {
              setSelectedId(id);
              setView('notes');
            }}
          />
        ) : selectedNote ? (
          <NoteEditor note={selectedNote} allNotes={notes} onNavigateToTitle={handleNavigateToTitle} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a note, or create a new one to get started.
          </div>
        )}
      </div>
    </div>
  );
}

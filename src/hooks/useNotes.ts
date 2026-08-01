import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuidv4 } from 'uuid';
import { db, type Note } from '../lib/db';

export function useAllNotes(): Note[] | undefined {
  return useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().toArray(), []);
}

export function useNote(id: string | undefined): Note | undefined {
  return useLiveQuery(() => (id ? db.notes.get(id) : undefined), [id]);
}

export async function createNote(partial?: Partial<Note>): Promise<Note> {
  const now = Date.now();
  const note: Note = {
    id: uuidv4(),
    title: partial?.title ?? 'Untitled',
    content: partial?.content ?? '',
    tags: partial?.tags ?? [],
    isDaily: partial?.isDaily ?? false,
    dailyDate: partial?.dailyDate,
    createdAt: now,
    updatedAt: now,
  };
  await db.notes.add(note);
  return note;
}

export async function updateNote(id: string, changes: Partial<Note>): Promise<void> {
  await db.notes.update(id, { ...changes, updatedAt: Date.now() });
}

export async function deleteNote(id: string): Promise<void> {
  await db.notes.delete(id);
}

export async function findNoteByTitle(title: string): Promise<Note | undefined> {
  const all = await db.notes.toArray();
  return all.find((n) => n.title.toLowerCase() === title.toLowerCase());
}

export async function getOrCreateDailyNote(date: string): Promise<Note> {
  const existing = await db.notes.where('dailyDate').equals(date).first();
  if (existing) return existing;
  return createNote({
    title: date,
    content: '',
    isDaily: true,
    dailyDate: date,
    tags: ['daily'],
  });
}

export function searchNotes(notes: Note[], query: string): Note[] {
  const q = query.trim().toLowerCase();
  if (!q) return notes;
  return notes.filter(
    (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some((t) => t.toLowerCase().includes(q)),
  );
}

export function allTags(notes: Note[]): string[] {
  const set = new Set<string>();
  for (const n of notes) for (const t of n.tags) set.add(t);
  return Array.from(set).sort();
}

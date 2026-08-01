import Dexie, { type EntityTable } from 'dexie';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isDaily: boolean;
  dailyDate?: string; // YYYY-MM-DD, only set when isDaily
  createdAt: number;
  updatedAt: number;
}

const db = new Dexie('nebula-db') as Dexie & {
  notes: EntityTable<Note, 'id'>;
};

db.version(1).stores({
  // Primary key + indexed props. Multi-entry index on tags for fast tag filtering.
  notes: 'id, title, updatedAt, createdAt, isDaily, dailyDate, *tags',
});

export { db };

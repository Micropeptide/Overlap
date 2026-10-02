// Node storage: a local SQLite file through node:sqlite, wrapped in the shared
// async store (store-core.js).

import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createStore, SCHEMA, MIGRATIONS } from './store-core.js';

export { randomId, newSecret, hashSecret, secretMatches, nameKey, slotsFor } from './store-core.js';

export function openStore(file, { retentionDays = 30 } = {}) {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL;');
  // Overwrite deleted content instead of leaving it in free pages of the file.
  db.exec('PRAGMA secure_delete = ON;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  for (const [table, column, ddl] of MIGRATIONS) {
    if (!db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
    }
  }

  const statements = new Map();
  const prepare = (sql) => {
    let st = statements.get(sql);
    if (!st) statements.set(sql, (st = db.prepare(sql)));
    return st;
  };

  const store = createStore({
    run: async (sql, params = []) => ({ changes: Number(prepare(sql).run(...params).changes) }),
    get: async (sql, params = []) => prepare(sql).get(...params) ?? null,
    all: async (sql, params = []) => prepare(sql).all(...params),
    // Push deletions out of the write-ahead log so they don't linger on disk.
    afterDelete: async () => {
      try { db.exec('PRAGMA wal_checkpoint(TRUNCATE);'); } catch { /* busy: the next delete catches up */ }
    },
  }, { retentionDays });

  return Object.assign(store, {
    db,
    close() { db.close(); },
  });
}

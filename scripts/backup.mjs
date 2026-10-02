// Write a consistent snapshot of the database: npm run backup [-- target-dir]
// Uses SQLite's VACUUM INTO, which is safe while the server is running.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const dataDir = resolve(process.env.DATA_DIR || 'data');
const source = join(dataDir, 'overlap.db');
const targetDir = resolve(process.argv[2] || 'backups');
if (!existsSync(source)) {
  console.error(`No database at ${source}. Set DATA_DIR if it lives elsewhere.`);
  process.exit(1);
}
mkdirSync(targetDir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
const target = join(targetDir, `overlap-${stamp}.db`);
const db = new DatabaseSync(source);
db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
db.close();
console.log(`Backed up to ${target}`);
console.log('Backups keep deleted polls until the backup itself is deleted. Remove old ones regularly.');

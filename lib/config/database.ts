import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const rootDir = process.cwd();
const dbDir = path.join(rootDir, 'db');
const dbPath = path.join(dbDir, 'slughub.db');

mkdirSync(dbDir, { recursive: true });

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(dbPath, 2); // Open read-write
  }
  return dbInstance;
}

export function closeDatabase(): void {
  dbInstance?.close();
  dbInstance = null;
}

export { dbPath };

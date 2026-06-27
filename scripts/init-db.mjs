import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const rootDir = path.resolve(process.cwd());
const dbDir = path.join(rootDir, 'db');
const dbPath = path.join(dbDir, 'slughub.db');
const schemaPath = path.join(rootDir, 'lib/config/schema.sql');

mkdirSync(dbDir, { recursive: true });

const schemaSql = readFileSync(schemaPath, 'utf8');
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA foreign_keys = ON;');
db.exec(schemaSql);
db.close();

console.log(`Database initialized at ${dbPath}`);

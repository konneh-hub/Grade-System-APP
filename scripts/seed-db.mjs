import { readFileSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const rootDir = path.resolve(process.cwd());
const dbPath = path.join(rootDir, 'db', 'slughub.db');
const seedPath = path.join(rootDir, 'lib', 'config', 'seed.sql');

const db = new DatabaseSync(dbPath);
const seedSql = readFileSync(seedPath, 'utf8');

db.exec(seedSql);
db.close();

console.log('Database seeded successfully.');

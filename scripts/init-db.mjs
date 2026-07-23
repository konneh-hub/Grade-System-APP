import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const rootDir = path.resolve(process.cwd());
const dbDir = path.join(rootDir, 'db');
const dbPath = path.join(dbDir, 'slughub.db');

mkdirSync(dbDir, { recursive: true });
execFileSync(process.execPath, ['scripts/migrate-db.mjs'], { cwd: rootDir, stdio: 'inherit' });
console.log(`Database initialized at ${dbPath}`);

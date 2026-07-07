import { readFileSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import bcryptjs from 'bcryptjs';

const rootDir = path.resolve(process.cwd());
const dbPath = path.join(rootDir, 'db', 'slughub.db');
const seedPath = path.join(rootDir, 'lib', 'config', 'seed.sql');

const db = new DatabaseSync(dbPath);
const seedSql = readFileSync(seedPath, 'utf8');

db.exec(seedSql);

// Generate bcrypt hashes for test users
const adminHash = bcryptjs.hashSync('admin123', 10);
const studentHash = bcryptjs.hashSync('student123', 10);

// Update password hashes
db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(adminHash, 'admin@slughub.local');
db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(studentHash, 'student@slughub.local');

db.close();

console.log('Database seeded successfully.');
console.log('Test credentials:');
console.log('  Admin: admin@slughub.local / admin123');
console.log('  Student: student@slughub.local / student123');

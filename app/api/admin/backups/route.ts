import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { dbPath, getDatabase } from '@/lib/config/database';

function ensureBackupTable() {
  const db = getDatabase();
  db.exec(`CREATE TABLE IF NOT EXISTS backup_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    backup_type TEXT NOT NULL DEFAULT 'full',
    include_logs INTEGER NOT NULL DEFAULT 1,
    size_bytes INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
}

export async function GET() {
  ensureBackupTable();
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT id, file_name, file_path, backup_type, include_logs, size_bytes, status, created_by, created_at
       FROM backup_records
       ORDER BY datetime(created_at) DESC`
    )
    .all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  ensureBackupTable();
  const body = (await req.json()) as Record<string, unknown>;
  const backupType = String(body.backup_type ?? body.type ?? 'full').trim().toLowerCase();
  const includeLogs = Boolean(body.include_logs ?? body.includeLogs ?? true);

  const backupDir = path.join(process.cwd(), 'db', 'backups');
  mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[.:]/g, '-');
  const fileName = `slughub-${backupType}-${timestamp}.db`;
  const filePath = path.join(backupDir, fileName);
  copyFileSync(dbPath, filePath);

  const sizeBytes = existsSync(filePath) ? statSync(filePath).size : 0;
  const db = getDatabase();
  const result = db
    .prepare(
      `INSERT INTO backup_records (file_name, file_path, backup_type, include_logs, size_bytes, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP)`
    )
    .run(fileName, filePath, backupType, includeLogs ? 1 : 0, sizeBytes) as { lastInsertRowid: number };

  return NextResponse.json({ ok: true, id: Number(result.lastInsertRowid), file_name: fileName, size_bytes: sizeBytes }, { status: 201 });
}

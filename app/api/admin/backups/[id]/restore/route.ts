import { copyFileSync, existsSync, renameSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import sqlite from 'node:sqlite';
import { NextResponse } from 'next/server';
import { dbPath, getDatabase, closeDatabase } from '@/lib/config/database';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

type ParamsContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: ParamsContext) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  const { id } = await context.params;
  const backupId = Number(id);
  if (!Number.isFinite(backupId)) return NextResponse.json({ error: 'Invalid backup id' }, { status: 400 });

  const body = (await req.json()) as Record<string, unknown>;
  if (!Boolean(body.confirm)) {
    return NextResponse.json({ error: 'Restore confirmation is required' }, { status: 400 });
  }

  const db = getDatabase();
  const record = db.prepare('SELECT file_path FROM backup_records WHERE id = ?').get(backupId) as { file_path: string } | null;
  if (!record) return NextResponse.json({ error: 'Backup record not found' }, { status: 404 });

  const backupDir = path.join(process.cwd(), 'db', 'backups');
  const resolvedSource = path.resolve(record.file_path);

  // safety checks
  if (!existsSync(resolvedSource)) {
    return NextResponse.json({ error: 'Backup file not found on disk' }, { status: 404 });
  }
  const resolvedBackupDir = path.resolve(backupDir) + path.sep;
  if (!resolvedSource.startsWith(resolvedBackupDir)) {
    return NextResponse.json({ error: 'Backup source is outside allowed backup directory' }, { status: 400 });
  }

  // prepare names for temporary files and pre-restore snapshot
  const timestamp = new Date().toISOString().replace(/[.:]/g, '-');
  const preRestorePath = path.join(backupDir, `pre-restore-${timestamp}.db`);
  const tempRestorePath = path.join(path.dirname(dbPath), `slughub.restore.${timestamp}.db.tmp`);

  try {
    // snapshot current DB so we can rollback if needed
    copyFileSync(dbPath, preRestorePath);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to snapshot current database before restore' }, { status: 500 });
  }

  // close in-process DB to release file locks
  try {
    closeDatabase();
  } catch (err) {
    // continue — closeDatabase should be best-effort
  }

  try {
    // copy source to a temp file in same folder as DB
    copyFileSync(resolvedSource, tempRestorePath);
  } catch (err) {
    // attempt to reopen DB and rollback snapshot location
    try { copyFileSync(preRestorePath, dbPath); } catch (_) {}
    getDatabase();
    return NextResponse.json({ error: 'Failed to copy backup file for restore' }, { status: 500 });
  }

  // validate the copied file is a reasonable SQLite DB
  try {
    const sqliteModule = sqlite as unknown as { DatabaseSync: new (filename: string) => { prepare(sql: string): { get(...p: unknown[]): unknown }; close(): void } };
    const testDb = new sqliteModule.DatabaseSync(tempRestorePath);
    // simple sanity check: there should be a sqlite_master table
    const meta = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1").get();
    testDb.close();
    if (!meta) throw new Error('Invalid sqlite file');
  } catch (err) {
    // restore original DB file before returning
    try { copyFileSync(preRestorePath, dbPath); } catch (_) {}
    getDatabase();
    return NextResponse.json({ error: 'Backup file failed validation' }, { status: 400 });
  }

  // move temp into place
  try {
    try { unlinkSync(dbPath); } catch (e) { /* ignore */ }
    renameSync(tempRestorePath, dbPath);
  } catch (err) {
    // fallback to copying
    try { copyFileSync(tempRestorePath, dbPath); } catch (copyErr) {
      // attempt rollback
      try { copyFileSync(preRestorePath, dbPath); } catch (_) {}
      getDatabase();
      return NextResponse.json({ error: 'Failed to install restored database' }, { status: 500 });
    }
  }

  // reopen DB for the running process
  try {
    getDatabase();
  } catch (err) {
    return NextResponse.json({ error: 'Restored database installed but failed to open' }, { status: 500 });
  }

  db.prepare(
    `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details, created_at)
     VALUES (NULL, 'Database restore executed', 'backup', ?, ?, CURRENT_TIMESTAMP)`
  ).run(backupId, JSON.stringify({ source: resolvedSource, pre_restore: preRestorePath }));

  return NextResponse.json({ ok: true, restored_from: resolvedSource });
}

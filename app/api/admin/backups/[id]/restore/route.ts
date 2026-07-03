import { copyFileSync } from 'node:fs';
import { NextResponse } from 'next/server';
import { dbPath, getDatabase } from '@/lib/config/database';

type ParamsContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: ParamsContext) {
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

  copyFileSync(record.file_path, dbPath);

  db.prepare(
    `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details, created_at)
     VALUES (NULL, 'Database restore executed', 'backup', ?, ?, CURRENT_TIMESTAMP)`
  ).run(backupId, JSON.stringify({ source: record.file_path }));

  return NextResponse.json({ ok: true });
}

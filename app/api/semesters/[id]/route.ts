import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';

type ParamsContext = { params: Promise<{ id: string }> };

function ensureSemestersTable() {
  const db = getDatabase();
  db.exec(`CREATE TABLE IF NOT EXISTS semesters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    academic_session_id INTEGER NOT NULL REFERENCES academic_sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'inactive',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
}

export async function PATCH(req: Request, context: ParamsContext) {
  ensureSemestersTable();
  const { id } = await context.params;
  const semesterId = Number(id);
  if (!Number.isFinite(semesterId)) return NextResponse.json({ error: 'Invalid semester id' }, { status: 400 });

  const body = (await req.json()) as Record<string, unknown>;
  const db = getDatabase();
  const existing = db
    .prepare('SELECT id, academic_session_id FROM semesters WHERE id = ?')
    .get(semesterId) as { id: number; academic_session_id: number } | null;
  if (!existing) return NextResponse.json({ error: 'Semester not found' }, { status: 404 });

  const status = body.status != null ? String(body.status).trim().toLowerCase() : null;
  if (status === 'active') {
    db.prepare('UPDATE semesters SET status = \"inactive\" WHERE academic_session_id = ?').run(existing.academic_session_id);
  }

  db.prepare(
    `UPDATE semesters
     SET name = COALESCE(?, name),
         start_date = COALESCE(?, start_date),
         end_date = COALESCE(?, end_date),
         status = COALESCE(?, status)
     WHERE id = ?`
  ).run(
    body.name != null ? String(body.name).trim() : null,
    body.start_date != null ? String(body.start_date) : null,
    body.end_date != null ? String(body.end_date) : null,
    status,
    semesterId
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, context: ParamsContext) {
  ensureSemestersTable();
  const { id } = await context.params;
  const semesterId = Number(id);
  if (!Number.isFinite(semesterId)) return NextResponse.json({ error: 'Invalid semester id' }, { status: 400 });

  const db = getDatabase();
  const result = db.prepare('DELETE FROM semesters WHERE id = ?').run(semesterId) as { changes?: number };
  if (!result.changes) return NextResponse.json({ error: 'Semester not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

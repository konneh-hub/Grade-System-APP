import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

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

export async function GET(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  ensureSemestersTable();
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT s.id, s.name, s.start_date, s.end_date, s.status, s.created_at, s.academic_session_id,
              a.name AS academic_session_name
       FROM semesters s
       JOIN academic_sessions a ON a.id = s.academic_session_id
       ORDER BY datetime(s.created_at) DESC`
    )
    .all();

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  ensureSemestersTable();
  const body = (await req.json()) as Record<string, unknown>;
  const name = String(body.name ?? '').trim();
  const sessionId = Number(body.academic_session_id ?? 0);
  const startDate = String(body.start_date ?? '').trim();
  const endDate = String(body.end_date ?? '').trim();
  const status = String(body.status ?? 'inactive').trim().toLowerCase();

  if (!name || !Number.isFinite(sessionId) || sessionId <= 0 || !startDate || !endDate) {
    return NextResponse.json({ error: 'name, academic_session_id, start_date and end_date are required' }, { status: 400 });
  }

  const db = getDatabase();
  const session = db.prepare('SELECT id, is_active FROM academic_sessions WHERE id = ?').get(sessionId) as { id: number; is_active: number } | null;
  if (!session) return NextResponse.json({ error: 'Academic session not found' }, { status: 404 });

  if (status === 'active') {
    db.prepare('UPDATE semesters SET status = \"inactive\" WHERE academic_session_id = ?').run(sessionId);
  }

  const result = db
    .prepare(
      `INSERT INTO semesters (academic_session_id, name, start_date, end_date, status, created_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
    .run(sessionId, name, startDate, endDate, status) as { lastInsertRowid: number };

  return NextResponse.json({ ok: true, id: Number(result.lastInsertRowid) }, { status: 201 });
}

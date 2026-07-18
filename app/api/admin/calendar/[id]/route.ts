import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

type ParamsContext = { params: Promise<{ id: string }> };

function ensureCalendarTable() {
  const db = getDatabase();
  db.exec(`CREATE TABLE IF NOT EXISTS academic_calendar_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
}

export async function PATCH(req: Request, context: ParamsContext) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  ensureCalendarTable();
  const { id } = await context.params;
  const eventId = Number(id);
  if (!Number.isFinite(eventId)) return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });

  const body = (await req.json()) as Record<string, unknown>;
  const db = getDatabase();
  const exists = db.prepare('SELECT id FROM academic_calendar_events WHERE id = ?').get(eventId) as { id: number } | null;
  if (!exists) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  db.prepare(
    `UPDATE academic_calendar_events
     SET title = COALESCE(?, title),
         category = COALESCE(?, category),
         start_date = COALESCE(?, start_date),
         end_date = COALESCE(?, end_date),
         description = COALESCE(?, description),
         status = COALESCE(?, status)
     WHERE id = ?`
  ).run(
    body.title != null ? String(body.title).trim() : null,
    body.category != null ? String(body.category).trim().toLowerCase() : null,
    body.start_date != null ? String(body.start_date) : null,
    body.end_date != null ? String(body.end_date) : null,
    body.description != null ? String(body.description) : null,
    body.status != null ? String(body.status).trim().toLowerCase() : null,
    eventId
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, context: ParamsContext) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  ensureCalendarTable();
  const { id } = await context.params;
  const eventId = Number(id);
  if (!Number.isFinite(eventId)) return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });

  const db = getDatabase();
  const result = db.prepare('DELETE FROM academic_calendar_events WHERE id = ?').run(eventId) as { changes?: number };
  if (!result.changes) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

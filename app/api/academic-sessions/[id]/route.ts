import { NextResponse, type NextRequest } from 'next/server';
import { getAcademicSessionById } from '@/lib/services/academicSessions';
import { getDatabase } from '@/lib/config/database';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const session = getAcademicSessionById(params.id);
  if (!session) {
    return NextResponse.json({ error: 'Academic session not found' }, { status: 404 });
  }
  return NextResponse.json({ data: session });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const sessionId = Number(params.id);
  if (!Number.isFinite(sessionId)) {
    return NextResponse.json({ error: 'Invalid session id' }, { status: 400 });
  }

  const db = getDatabase();
  const existing = db.prepare('SELECT id FROM academic_sessions WHERE id = ?').get(sessionId) as { id: number } | null;
  if (!existing) {
    return NextResponse.json({ error: 'Academic session not found' }, { status: 404 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const status = body.status != null ? String(body.status).trim().toLowerCase() : null;
  const isActive = body.is_active != null ? (Boolean(body.is_active) ? 1 : 0) : null;

  const resolvedIsActive = status === 'closed' ? 0 : isActive;

  if (resolvedIsActive === 1) {
    db.prepare('UPDATE academic_sessions SET is_active = 0').run();
  }

  db.prepare(
    `UPDATE academic_sessions
     SET name = COALESCE(?, name),
         code = COALESCE(?, code),
         start_date = COALESCE(?, start_date),
         end_date = COALESCE(?, end_date),
         is_active = COALESCE(?, is_active)
     WHERE id = ?`
  ).run(
    body.name != null ? String(body.name).trim() : null,
    body.code != null ? String(body.code).trim().toUpperCase() : null,
    body.start_date != null ? String(body.start_date) : null,
    body.end_date != null ? String(body.end_date) : null,
    resolvedIsActive,
    sessionId
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const sessionId = Number(params.id);
  if (!Number.isFinite(sessionId)) {
    return NextResponse.json({ error: 'Invalid session id' }, { status: 400 });
  }

  const db = getDatabase();
  const semestersCount = db.prepare('SELECT COUNT(*) AS count FROM semesters WHERE academic_session_id = ?').get(sessionId) as { count: number } | null;
  if (Number(semestersCount?.count ?? 0) > 0) {
    return NextResponse.json({ error: 'Cannot delete session with linked semesters' }, { status: 409 });
  }

  const result = db.prepare('DELETE FROM academic_sessions WHERE id = ?').run(sessionId) as { changes?: number };
  if (!result.changes) return NextResponse.json({ error: 'Academic session not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

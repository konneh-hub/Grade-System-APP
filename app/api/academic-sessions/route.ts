import { NextResponse } from 'next/server';
import { getAcademicSessions } from '@/lib/services/academicSessions';
import { getDatabase } from '@/lib/config/database';

export async function GET() {
  const sessions = getAcademicSessions();
  return NextResponse.json({ data: sessions, count: sessions.length });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const name = String(body.name ?? '').trim();
  const code = String(body.code ?? name).trim().toUpperCase();
  const startDate = String(body.start_date ?? body.startDate ?? '').trim();
  const endDate = String(body.end_date ?? body.endDate ?? '').trim();
  const isActive = Boolean(body.is_active ?? body.isActive ?? false);

  if (!name || !startDate || !endDate) {
    return NextResponse.json({ error: 'name, start_date and end_date are required' }, { status: 400 });
  }

  const db = getDatabase();
  const existing = db.prepare('SELECT id FROM academic_sessions WHERE code = ?').get(code) as { id: number } | null;
  if (existing) {
    return NextResponse.json({ error: 'Session code already exists' }, { status: 409 });
  }

  if (isActive) {
    db.prepare('UPDATE academic_sessions SET is_active = 0').run();
  }

  const result = db
    .prepare(
      `INSERT INTO academic_sessions (name, code, start_date, end_date, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
    .run(name, code, startDate, endDate, isActive ? 1 : 0) as { lastInsertRowid: number };

  return NextResponse.json({ ok: true, id: Number(result.lastInsertRowid) }, { status: 201 });
}

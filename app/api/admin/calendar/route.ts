import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';

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

export async function GET() {
  ensureCalendarTable();
  const db = getDatabase();
  const rows = db
    .prepare('SELECT id, title, category, start_date, end_date, description, status, created_at FROM academic_calendar_events ORDER BY start_date ASC')
    .all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  ensureCalendarTable();
  const body = (await req.json()) as Record<string, unknown>;
  const title = String(body.title ?? '').trim();
  const category = String(body.category ?? 'general').trim().toLowerCase();
  const startDate = String(body.start_date ?? '').trim();
  const endDate = String(body.end_date ?? '').trim();
  const description = String(body.description ?? '').trim();
  const status = String(body.status ?? 'active').trim().toLowerCase();

  if (!title || !startDate || !endDate) {
    return NextResponse.json({ error: 'title, start_date and end_date are required' }, { status: 400 });
  }

  const db = getDatabase();
  const result = db
    .prepare(
      `INSERT INTO academic_calendar_events (title, category, start_date, end_date, description, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
    .run(title, category, startDate, endDate, description || null, status) as { lastInsertRowid: number };

  return NextResponse.json({ ok: true, id: Number(result.lastInsertRowid) }, { status: 201 });
}

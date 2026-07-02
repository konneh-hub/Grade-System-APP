import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';

export async function GET() {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT f.id, f.name, f.code, f.description, f.created_at,
              COUNT(d.id) AS departments_count
       FROM faculties f
       LEFT JOIN departments d ON d.faculty_id = f.id
       GROUP BY f.id
       ORDER BY f.name ASC`
    )
    .all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const name = String(body.name ?? '').trim();
  const code = String(body.code ?? '').trim().toUpperCase();
  const description = String(body.description ?? '').trim();

  if (!name || !code) {
    return NextResponse.json({ error: 'name and code are required' }, { status: 400 });
  }

  const db = getDatabase();
  const existing = db.prepare('SELECT id FROM faculties WHERE code = ?').get(code) as { id: number } | null;
  if (existing) return NextResponse.json({ error: 'Faculty code already exists' }, { status: 409 });

  const result = db
    .prepare('INSERT INTO faculties (name, code, description, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)')
    .run(name, code, description || null) as { lastInsertRowid: number };

  return NextResponse.json({ id: Number(result.lastInsertRowid), name, code }, { status: 201 });
}

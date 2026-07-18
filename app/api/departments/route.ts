import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

export async function GET(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT d.id, d.name, d.code, d.description, d.faculty_id, d.created_at,
              f.name AS faculty_name
       FROM departments d
       LEFT JOIN faculties f ON f.id = d.faculty_id
       ORDER BY d.name ASC`
    )
    .all();

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  const body = (await req.json()) as Record<string, unknown>;
  const name = String(body.name ?? '').trim();
  const code = String(body.code ?? '').trim().toUpperCase();
  const description = String(body.description ?? '').trim();
  const facultyId = Number(body.faculty_id ?? body.facultyId ?? 0);

  if (!name || !code || !Number.isFinite(facultyId) || facultyId <= 0) {
    return NextResponse.json({ error: 'name, code, and valid faculty_id are required' }, { status: 400 });
  }

  const db = getDatabase();
  const faculty = db.prepare('SELECT id FROM faculties WHERE id = ?').get(facultyId) as { id: number } | null;
  if (!faculty) return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });

  const existing = db.prepare('SELECT id FROM departments WHERE code = ?').get(code) as { id: number } | null;
  if (existing) return NextResponse.json({ error: 'Department code already exists' }, { status: 409 });

  const result = db
    .prepare('INSERT INTO departments (faculty_id, name, code, description, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)')
    .run(facultyId, name, code, description || null) as { lastInsertRowid: number };

  return NextResponse.json({ id: Number(result.lastInsertRowid), name, code, faculty_id: facultyId }, { status: 201 });
}

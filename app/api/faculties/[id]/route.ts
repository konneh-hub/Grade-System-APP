import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';

type ParamsContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: ParamsContext) {
  const { id } = await context.params;
  const facultyId = Number(id);
  if (!Number.isFinite(facultyId)) return NextResponse.json({ error: 'Invalid faculty id' }, { status: 400 });

  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT f.id, f.name, f.code, f.description, f.created_at, COUNT(d.id) AS departments_count
       FROM faculties f
       LEFT JOIN departments d ON d.faculty_id = f.id
       WHERE f.id = ?
       GROUP BY f.id`
    )
    .get(facultyId) as Record<string, unknown> | null;

  if (!row) return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, context: ParamsContext) {
  const { id } = await context.params;
  const facultyId = Number(id);
  if (!Number.isFinite(facultyId)) return NextResponse.json({ error: 'Invalid faculty id' }, { status: 400 });

  const body = (await req.json()) as Record<string, unknown>;
  const db = getDatabase();

  const exists = db.prepare('SELECT id FROM faculties WHERE id = ?').get(facultyId) as { id: number } | null;
  if (!exists) return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });

  db.prepare(
    `UPDATE faculties
     SET name = COALESCE(?, name),
         code = COALESCE(?, code),
         description = COALESCE(?, description)
     WHERE id = ?`
  ).run(
    body.name != null ? String(body.name) : null,
    body.code != null ? String(body.code).toUpperCase() : null,
    body.description != null ? String(body.description) : null,
    facultyId
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, context: ParamsContext) {
  const { id } = await context.params;
  const facultyId = Number(id);
  if (!Number.isFinite(facultyId)) return NextResponse.json({ error: 'Invalid faculty id' }, { status: 400 });

  const db = getDatabase();
  const departmentsCount = db.prepare('SELECT COUNT(*) AS count FROM departments WHERE faculty_id = ?').get(facultyId) as { count: number } | null;
  if (Number(departmentsCount?.count ?? 0) > 0) {
    return NextResponse.json({ error: 'Cannot delete faculty with departments' }, { status: 409 });
  }

  const result = db.prepare('DELETE FROM faculties WHERE id = ?').run(facultyId) as { changes?: number };
  if (!result.changes) return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

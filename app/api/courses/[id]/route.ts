import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';

type ParamsContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: ParamsContext) {
  const { id } = await context.params;
  const courseId = Number(id);
  if (!Number.isFinite(courseId)) return NextResponse.json({ error: 'Invalid course id' }, { status: 400 });

  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT c.id, c.code, c.title, c.unit, c.level, c.semester, c.department_id, d.name AS department_name,
              c.created_at
       FROM courses c
       LEFT JOIN departments d ON d.id = c.department_id
       WHERE c.id = ?`
    )
    .get(courseId) as Record<string, unknown> | null;

  if (!row) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, context: ParamsContext) {
  const { id } = await context.params;
  const courseId = Number(id);
  if (!Number.isFinite(courseId)) return NextResponse.json({ error: 'Invalid course id' }, { status: 400 });

  const body = (await req.json()) as Record<string, unknown>;
  const db = getDatabase();

  const exists = db.prepare('SELECT id FROM courses WHERE id = ?').get(courseId) as { id: number } | null;
  if (!exists) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

  if (body.department_id != null) {
    const department = db.prepare('SELECT id FROM departments WHERE id = ?').get(Number(body.department_id)) as { id: number } | null;
    if (!department) return NextResponse.json({ error: 'Invalid department_id' }, { status: 400 });
  }

  db.prepare(
    `UPDATE courses
     SET code = COALESCE(?, code),
         title = COALESCE(?, title),
         unit = COALESCE(?, unit),
         level = COALESCE(?, level),
         semester = COALESCE(?, semester),
         department_id = COALESCE(?, department_id)
     WHERE id = ?`
  ).run(
    body.code != null ? String(body.code).toUpperCase() : null,
    body.title != null ? String(body.title) : null,
    body.unit != null ? Number(body.unit) : null,
    body.level != null ? String(body.level) : null,
    body.semester != null ? String(body.semester) : null,
    body.department_id != null ? Number(body.department_id) : null,
    courseId
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, context: ParamsContext) {
  const { id } = await context.params;
  const courseId = Number(id);
  if (!Number.isFinite(courseId)) return NextResponse.json({ error: 'Invalid course id' }, { status: 400 });

  const db = getDatabase();
  const resultsCount = db.prepare('SELECT COUNT(*) AS count FROM results WHERE course_id = ?').get(courseId) as { count: number } | null;
  if (Number(resultsCount?.count ?? 0) > 0) {
    return NextResponse.json({ error: 'Cannot delete course with submitted results' }, { status: 409 });
  }

  const result = db.prepare('DELETE FROM courses WHERE id = ?').run(courseId) as { changes?: number };
  if (!result.changes) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

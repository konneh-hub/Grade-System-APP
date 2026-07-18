import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

type ParamsContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: ParamsContext) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  const { id } = await context.params;
  const departmentId = Number(id);
  if (!Number.isFinite(departmentId)) return NextResponse.json({ error: 'Invalid department id' }, { status: 400 });

  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT d.id, d.name, d.code, d.description, d.faculty_id, f.name AS faculty_name, d.created_at,
              COUNT(c.id) AS courses_count
       FROM departments d
       JOIN faculties f ON f.id = d.faculty_id
       LEFT JOIN courses c ON c.department_id = d.id
       WHERE d.id = ?
       GROUP BY d.id`
    )
    .get(departmentId) as Record<string, unknown> | null;

  if (!row) return NextResponse.json({ error: 'Department not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, context: ParamsContext) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  const { id } = await context.params;
  const departmentId = Number(id);
  if (!Number.isFinite(departmentId)) return NextResponse.json({ error: 'Invalid department id' }, { status: 400 });

  const body = (await req.json()) as Record<string, unknown>;
  const db = getDatabase();

  const exists = db.prepare('SELECT id FROM departments WHERE id = ?').get(departmentId) as { id: number } | null;
  if (!exists) return NextResponse.json({ error: 'Department not found' }, { status: 404 });

  if (body.faculty_id != null) {
    const faculty = db.prepare('SELECT id FROM faculties WHERE id = ?').get(Number(body.faculty_id)) as { id: number } | null;
    if (!faculty) return NextResponse.json({ error: 'Invalid faculty_id' }, { status: 400 });
  }

  db.prepare(
    `UPDATE departments
     SET name = COALESCE(?, name),
         code = COALESCE(?, code),
         description = COALESCE(?, description),
         faculty_id = COALESCE(?, faculty_id)
     WHERE id = ?`
  ).run(
    body.name != null ? String(body.name) : null,
    body.code != null ? String(body.code).toUpperCase() : null,
    body.description != null ? String(body.description) : null,
    body.faculty_id != null ? Number(body.faculty_id) : null,
    departmentId
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, context: ParamsContext) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  const { id } = await context.params;
  const departmentId = Number(id);
  if (!Number.isFinite(departmentId)) return NextResponse.json({ error: 'Invalid department id' }, { status: 400 });

  const db = getDatabase();
  const coursesCount = db.prepare('SELECT COUNT(*) AS count FROM courses WHERE department_id = ?').get(departmentId) as { count: number } | null;
  if (Number(coursesCount?.count ?? 0) > 0) {
    return NextResponse.json({ error: 'Cannot delete department with courses' }, { status: 409 });
  }

  const result = db.prepare('DELETE FROM departments WHERE id = ?').run(departmentId) as { changes?: number };
  if (!result.changes) return NextResponse.json({ error: 'Department not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

type ParamsContext = { params: Promise<{ id: string }> };

function normalizeCourseLevel(value: unknown): number {
  const raw = String(value ?? 'year1').trim().toLowerCase();
  const mapping: Record<string, number> = {
    year1: 100,
    year2: 200,
    year3: 300,
    year4: 400,
    year5: 500,
    '100': 100,
    '200': 200,
    '300': 300,
    '400': 400,
    '500': 500,
    '1': 100,
    '2': 200,
    '3': 300,
    '4': 400,
    '5': 500,
  };

  return mapping[raw] ?? 100;
}

export async function GET(req: Request, context: ParamsContext) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  const { id } = await context.params;
  const courseId = Number(id);
  if (!Number.isFinite(courseId)) return NextResponse.json({ error: 'Invalid course id' }, { status: 400 });

  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT c.id, c.code, c.title, c.description, c.credit_units, c.level, c.semester, c.department_id, c.programme_id, c.is_active, d.name AS department_name,
              p.name AS programme_name, f.name AS faculty_name, c.created_at
       FROM courses c
       LEFT JOIN departments d ON d.id = c.department_id
       LEFT JOIN programs p ON p.id = c.programme_id
       LEFT JOIN faculties f ON f.id = d.faculty_id
       WHERE c.id = ?`
    )
    .get(courseId) as Record<string, unknown> | null;

  if (!row) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, context: ParamsContext) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
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

  const levelValue = body.level != null ? normalizeCourseLevel(body.level) : null;
  db.prepare(
    `UPDATE courses
     SET code = COALESCE(?, code),
         title = COALESCE(?, title),
         description = COALESCE(?, description),
         credit_units = COALESCE(?, credit_units),
         level = COALESCE(?, level),
         semester = COALESCE(?, semester),
         department_id = COALESCE(?, department_id),
         programme_id = COALESCE(?, programme_id),
         is_active = COALESCE(?, is_active)
     WHERE id = ?`
  ).run(
    body.code != null ? String(body.code).toUpperCase() : null,
    body.title != null ? String(body.title) : null,
    body.description != null ? String(body.description) : null,
    body.unit != null ? Number(body.unit) : body.credit_units != null ? Number(body.credit_units) : null,
    levelValue,
    body.semester != null ? String(body.semester) : null,
    body.department_id != null ? Number(body.department_id) : null,
    body.programme_id != null ? Number(body.programme_id) : null,
    body.is_active != null ? Number(body.is_active) : body.status != null ? (String(body.status).toLowerCase() === 'archived' ? 0 : 1) : null,
    courseId
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, context: ParamsContext) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
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

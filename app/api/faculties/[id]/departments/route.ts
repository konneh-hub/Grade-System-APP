import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireRoles } from '@/lib/middleware/authorization';

type ParamsContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: ParamsContext) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;

  const { id } = await context.params;
  const facultyId = Number(id);
  if (!Number.isFinite(facultyId) || facultyId <= 0) {
    return NextResponse.json({ error: 'Invalid faculty id' }, { status: 400 });
  }

  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT d.id,
              d.faculty_id,
              d.name,
              d.code,
              d.description,
              d.created_at
       FROM departments d
       WHERE d.faculty_id = ?
       ORDER BY d.name ASC`
    )
    .all(facultyId) as Array<Record<string, unknown>>;

  return NextResponse.json(rows);
}

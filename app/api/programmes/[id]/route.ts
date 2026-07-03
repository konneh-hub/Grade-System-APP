import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';

type ParamsContext = { params: Promise<{ id: string }> };

function ensureProgramColumns() {
  const db = getDatabase();
  const cols = db.prepare('PRAGMA table_info(programs)').all() as Array<{ name: string }>;
  const names = new Set(cols.map((col) => col.name));
  if (!names.has('degree_type')) {
    db.exec("ALTER TABLE programs ADD COLUMN degree_type TEXT DEFAULT 'bsc'");
  }
  if (!names.has('status')) {
    db.exec("ALTER TABLE programs ADD COLUMN status TEXT DEFAULT 'active'");
  }
}

export async function PATCH(req: Request, context: ParamsContext) {
  ensureProgramColumns();
  const { id } = await context.params;
  const programId = Number(id);
  if (!Number.isFinite(programId)) return NextResponse.json({ error: 'Invalid programme id' }, { status: 400 });

  const body = (await req.json()) as Record<string, unknown>;
  const db = getDatabase();
  const exists = db.prepare('SELECT id FROM programs WHERE id = ?').get(programId) as { id: number } | null;
  if (!exists) return NextResponse.json({ error: 'Programme not found' }, { status: 404 });

  if (body.department_id != null) {
    const department = db.prepare('SELECT id FROM departments WHERE id = ?').get(Number(body.department_id)) as { id: number } | null;
    if (!department) return NextResponse.json({ error: 'Department not found' }, { status: 404 });
  }

  db.prepare(
    `UPDATE programs
     SET name = COALESCE(?, name),
         code = COALESCE(?, code),
         department_id = COALESCE(?, department_id),
         duration_years = COALESCE(?, duration_years),
         degree_type = COALESCE(?, degree_type),
         status = COALESCE(?, status)
     WHERE id = ?`
  ).run(
    body.name != null ? String(body.name).trim() : null,
    body.code != null ? String(body.code).trim().toUpperCase() : null,
    body.department_id != null ? Number(body.department_id) : null,
    body.duration_years != null ? Number(body.duration_years) : null,
    body.degree_type != null ? String(body.degree_type).trim().toLowerCase() : null,
    body.status != null ? String(body.status).trim().toLowerCase() : null,
    programId
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, context: ParamsContext) {
  ensureProgramColumns();
  const { id } = await context.params;
  const programId = Number(id);
  if (!Number.isFinite(programId)) return NextResponse.json({ error: 'Invalid programme id' }, { status: 400 });

  const db = getDatabase();
  const studentsCount = db.prepare('SELECT COUNT(*) AS count FROM students WHERE program_id = ?').get(programId) as { count: number } | null;
  if (Number(studentsCount?.count ?? 0) > 0) {
    return NextResponse.json({ error: 'Cannot delete programme with enrolled students' }, { status: 409 });
  }

  const result = db.prepare('DELETE FROM programs WHERE id = ?').run(programId) as { changes?: number };
  if (!result.changes) return NextResponse.json({ error: 'Programme not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

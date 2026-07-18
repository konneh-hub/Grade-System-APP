import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

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

export async function GET(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  ensureProgramColumns();
  const { searchParams } = new URL(req.url);
  const query = String(searchParams.get('q') ?? '').trim().toLowerCase();
  const status = String(searchParams.get('status') ?? '').trim().toLowerCase();
  const departmentId = Number(searchParams.get('department_id') ?? 0);

  const db = getDatabase();
  const where: string[] = [];
  const params: unknown[] = [];

  if (query) {
    where.push('(LOWER(p.name) LIKE ? OR LOWER(p.code) LIKE ?)');
    params.push(`%${query}%`, `%${query}%`);
  }
  if (status) {
    where.push('LOWER(COALESCE(p.status, \"active\")) = ?');
    params.push(status);
  }
  if (Number.isFinite(departmentId) && departmentId > 0) {
    where.push('p.department_id = ?');
    params.push(departmentId);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db
    .prepare(
      `SELECT p.id, p.name, p.code, p.duration_years, p.department_id, p.degree_type, p.status, p.created_at,
              d.name AS department_name, f.name AS faculty_name
       FROM programs p
       LEFT JOIN departments d ON d.id = p.department_id
       LEFT JOIN faculties f ON f.id = d.faculty_id
       ${whereClause}
       ORDER BY p.name ASC`
    )
    .all(...params);

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  ensureProgramColumns();
  const body = (await req.json()) as Record<string, unknown>;
  const name = String(body.name ?? '').trim();
  const code = String(body.code ?? '').trim().toUpperCase();
  const departmentId = Number(body.department_id ?? 0);
  const durationYears = Number(body.duration_years ?? body.duration ?? 4);
  const degreeType = String(body.degree_type ?? 'bsc').trim().toLowerCase();
  const status = String(body.status ?? 'active').trim().toLowerCase();

  if (!name || !code || !Number.isFinite(departmentId) || departmentId <= 0) {
    return NextResponse.json({ error: 'name, code and valid department_id are required' }, { status: 400 });
  }

  const db = getDatabase();
  const department = db.prepare('SELECT id FROM departments WHERE id = ?').get(departmentId) as { id: number } | null;
  if (!department) return NextResponse.json({ error: 'Department not found' }, { status: 404 });

  const existing = db.prepare('SELECT id FROM programs WHERE code = ?').get(code) as { id: number } | null;
  if (existing) return NextResponse.json({ error: 'Programme code already exists' }, { status: 409 });

  const result = db
    .prepare(
      `INSERT INTO programs (department_id, name, code, duration_years, degree_type, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
    .run(departmentId, name, code, durationYears, degreeType, status) as { lastInsertRowid: number };

  return NextResponse.json({ ok: true, id: Number(result.lastInsertRowid) }, { status: 201 });
}

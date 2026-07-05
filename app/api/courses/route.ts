import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = String(searchParams.get('q') ?? '').trim().toLowerCase();
  const departmentId = Number(searchParams.get('department_id') ?? 0);
  const programmeId = Number(searchParams.get('programme_id') ?? 0);
  const facultyId = Number(searchParams.get('faculty_id') ?? 0);
  const levelParam = searchParams.get('level') ?? '';
  const level = normalizeCourseLevel(levelParam);
  const semester = String(searchParams.get('semester') ?? '').trim().toLowerCase();
  const status = String(searchParams.get('status') ?? '').trim().toLowerCase();

  const db = getDatabase();
  const where: string[] = [];
  const params: unknown[] = [];

  if (query) {
    where.push('(LOWER(c.code) LIKE ? OR LOWER(c.title) LIKE ?)');
    params.push(`%${query}%`, `%${query}%`);
  }

  if (Number.isFinite(departmentId) && departmentId > 0) {
    where.push('c.department_id = ?');
    params.push(departmentId);
  }

  if (Number.isFinite(programmeId) && programmeId > 0) {
    where.push('c.programme_id = ?');
    params.push(programmeId);
  }

  if (Number.isFinite(facultyId) && facultyId > 0) {
    where.push('d.faculty_id = ?');
    params.push(facultyId);
  }

  if (levelParam) {
    where.push('c.level = ?');
    params.push(level);
  }

  if (semester) {
    where.push('LOWER(c.semester) = ?');
    params.push(semester);
  }

  if (status) {
    where.push('c.is_active = ?');
    params.push(status === 'archived' ? 0 : 1);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db
    .prepare(
      `SELECT c.id, c.code, c.title, c.description, c.department_id, c.programme_id, c.credit_units, c.level, c.semester, c.is_active, c.created_at,
              d.name AS department_name, p.name AS programme_name, f.name AS faculty_name
       FROM courses c
       LEFT JOIN departments d ON d.id = c.department_id
       LEFT JOIN programs p ON p.id = c.programme_id
       LEFT JOIN faculties f ON f.id = d.faculty_id
       ${whereClause}
       ORDER BY c.title ASC`
    )
    .all(...params);

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const db = getDatabase();
  const code = String(body.code ?? '').trim().toUpperCase();
  const title = String(body.title ?? '').trim();
  const description = String(body.description ?? '').trim();
  const departmentId = Number(body.department_id ?? 0);
  const programmeId = Number(body.programme_id ?? 0);
  const creditUnits = Number(body.credit_units ?? body.unit ?? 3);
  const level = normalizeCourseLevel(body.level);
  const semester = String(body.semester ?? 'first').trim().toLowerCase();
  const status = String(body.status ?? body.is_active ?? 'active').trim().toLowerCase();

  if (!code || !title || !Number.isFinite(departmentId) || departmentId <= 0 || !Number.isFinite(programmeId) || programmeId <= 0) {
    return NextResponse.json({ error: 'Course code, title, department, and programme are required.' }, { status: 400 });
  }

  const result = db
    .prepare(
      `INSERT INTO courses (code, title, description, department_id, programme_id, credit_units, level, semester, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
    .run(code, title, description || null, departmentId, programmeId, creditUnits, level, semester, status === 'archived' ? 0 : 1) as { lastInsertRowid: number };

  return NextResponse.json({ ok: true, id: Number(result.lastInsertRowid) }, { status: 201 });
}

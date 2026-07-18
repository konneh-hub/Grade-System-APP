import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

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

function normalizeSemester(value: unknown): string {
  const raw = String(value ?? 'first').trim().toLowerCase();
  const mapping: Record<string, string> = {
    first: 'first',
    1: 'first',
    semester1: 'first',
    firstsemester: 'first',
    second: 'second',
    2: 'second',
    semester2: 'second',
    secondsemester: 'second',
    third: 'third',
    3: 'third',
    summer: 'third',
  };

  return mapping[raw] ?? 'first';
}

function normalizeStatus(value: unknown): number {
  const raw = String(value ?? 'active').trim().toLowerCase();
  return raw === 'archived' || raw === 'inactive' || raw === '0' ? 0 : 1;
}

export async function POST(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  const body = await req.json();
  const rows = Array.isArray(body) ? body : [];
  const db = getDatabase();

  if (!rows.length) {
    return NextResponse.json({ error: 'No course rows were provided.' }, { status: 400 });
  }

  let imported = 0;
  for (const row of rows) {
    const code = String(row?.code ?? '').trim().toUpperCase();
    const title = String(row?.title ?? '').trim();
    const departmentId = Number(row?.department_id ?? 0);
    const programmeId = Number(row?.programme_id ?? 0);

    if (!code || !title || !Number.isFinite(departmentId) || departmentId <= 0 || !Number.isFinite(programmeId) || programmeId <= 0) {
      continue;
    }

    db.prepare(
      `INSERT INTO courses (code, title, description, department_id, programme_id, credit_units, level, semester, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    ).run(
      code,
      title,
      String(row?.description ?? '').trim() || null,
      departmentId,
      programmeId,
      Number(row?.credit_units ?? 3),
      normalizeCourseLevel(row?.level),
      normalizeSemester(row?.semester),
      normalizeStatus(row?.status)
    );
    imported += 1;
  }

  return NextResponse.json({ imported, failed: rows.length - imported });
}

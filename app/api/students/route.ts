import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

export async function GET(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT id, user_id, program_id, department_id, current_level, entry_session_id, graduation_status, created_at, updated_at
       FROM students ORDER BY id ASC`
    )
    .all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  const body = await req.json();
  const db = getDatabase();
  // Generate matric_number internally to avoid accepting it from clients
  const generatedMatric = `REG-${body.user_id ?? '0'}-${Date.now()}`;
  const result = db
    .prepare(
      `INSERT INTO students (user_id, matric_number, program_id, department_id, current_level, entry_session_id, graduation_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    )
    .run(body.user_id ?? null, generatedMatric, body.program_id ?? null, body.department_id ?? null, body.current_level ?? 100, body.entry_session_id ?? null, body.graduation_status ?? 'in_progress') as { lastInsertRowid: number };

  return NextResponse.json({ id: Number(result.lastInsertRowid) });
}

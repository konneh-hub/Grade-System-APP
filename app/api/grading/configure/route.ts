import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

export async function GET(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT gc.id, gc.department_id, gc.academic_session_id, gc.grade_scale, gc.pass_mark, gc.ca_weight, gc.exam_weight, gc.created_at,
              d.name AS department_name,
              s.name AS session_name
       FROM grading_configurations gc
       LEFT JOIN departments d ON d.id = gc.department_id
       LEFT JOIN academic_sessions s ON s.id = gc.academic_session_id
       ORDER BY datetime(gc.created_at) DESC`
    )
    .all();

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const guard = requireRoles(req, ['admin','system_admin']);
  if ('error' in guard) return guard.error;
  const body = (await req.json()) as Record<string, unknown>;

  const departmentId = body.department_id != null ? Number(body.department_id) : null;
  const sessionId = body.academic_session_id != null ? Number(body.academic_session_id) : null;
  const gradeScale = String(body.grade_scale ?? 'standard').trim().toLowerCase();
  const passMark = Number(body.pass_mark ?? 40);
  const caWeight = Number(body.ca_weight ?? 0.4);
  const examWeight = Number(body.exam_weight ?? 0.6);

  if (departmentId == null || !Number.isFinite(departmentId) || departmentId <= 0) {
    return NextResponse.json({ error: 'Valid department_id is required' }, { status: 400 });
  }
  if (sessionId == null || !Number.isFinite(sessionId) || sessionId <= 0) {
    return NextResponse.json({ error: 'Valid academic_session_id is required' }, { status: 400 });
  }
  if (!Number.isFinite(passMark) || passMark < 0 || passMark > 100) {
    return NextResponse.json({ error: 'pass_mark must be between 0 and 100' }, { status: 400 });
  }
  if (!Number.isFinite(caWeight) || !Number.isFinite(examWeight) || caWeight < 0 || examWeight < 0) {
    return NextResponse.json({ error: 'Weights must be non-negative numbers' }, { status: 400 });
  }

  const totalWeight = Number((caWeight + examWeight).toFixed(6));
  if (Math.abs(totalWeight - 1) > 0.0001) {
    return NextResponse.json({ error: 'ca_weight and exam_weight must sum to 1.0' }, { status: 400 });
  }

  const db = getDatabase();
  const department = db.prepare('SELECT id FROM departments WHERE id = ?').get(departmentId) as { id: number } | null;
  if (!department) return NextResponse.json({ error: 'Department not found' }, { status: 404 });

  const session = db.prepare('SELECT id FROM academic_sessions WHERE id = ?').get(sessionId) as { id: number } | null;
  if (!session) return NextResponse.json({ error: 'Academic session not found' }, { status: 404 });

  const result = db
    .prepare(
      `INSERT INTO grading_configurations (department_id, academic_session_id, grade_scale, pass_mark, ca_weight, exam_weight, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
    .run(departmentId, sessionId, gradeScale, passMark, caWeight, examWeight) as { lastInsertRowid: number };

  return NextResponse.json({ ok: true, id: Number(result.lastInsertRowid) }, { status: 201 });
}

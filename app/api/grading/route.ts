import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';

export async function GET() {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT gc.*, d.name AS department_name, s.name AS session_name
       FROM grading_configurations gc
       LEFT JOIN departments d ON d.id = gc.department_id
       LEFT JOIN academic_sessions s ON s.id = gc.academic_session_id
       ORDER BY gc.id DESC`
    )
    .all();
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const departmentId = body.department_id != null ? Number(body.department_id) : null;
  const sessionId = body.academic_session_id != null ? Number(body.academic_session_id) : null;
  const gradeScale = String(body.grade_scale ?? body.gradeScale ?? 'standard');
  const passMark = Number(body.pass_mark ?? body.passMark ?? 40);
  const caWeight = Number(body.ca_weight ?? body.caWeight ?? 0.4);
  const examWeight = Number(body.exam_weight ?? body.examWeight ?? 0.6);

  const db = getDatabase();
  const result = db
    .prepare(
      `INSERT INTO grading_configurations (department_id, academic_session_id, grade_scale, pass_mark, ca_weight, exam_weight, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    )
    .run(departmentId, sessionId, gradeScale, passMark, caWeight, examWeight) as { lastInsertRowid: number };

  return NextResponse.json({ ok: true, id: Number(result.lastInsertRowid) }, { status: 201 });
}

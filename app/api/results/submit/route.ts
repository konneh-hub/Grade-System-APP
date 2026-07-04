import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuthRole, scoreToGrade, writeAudit } from '@/app/api/results/_shared';

export async function POST(req: Request) {
  const guard = requireAuthRole(req, ['lecturer']);
  if ('error' in guard) return guard.error;

  const body = (await req.json()) as Record<string, unknown>;
  const resultId = Number(body.result_id ?? 0);
  if (!Number.isFinite(resultId) || resultId <= 0) {
    return NextResponse.json({ error: 'result_id is required' }, { status: 400 });
  }

  const caScore = body.ca_score != null ? Number(body.ca_score) : null;
  const examScore = body.exam_score != null ? Number(body.exam_score) : null;

  const db = getDatabase();
  const existing = db.prepare('SELECT id, ca_score, exam_score, status FROM results WHERE id = ?').get(resultId) as { id: number; ca_score: number; exam_score: number; status: string } | null;
  if (!existing) return NextResponse.json({ error: 'Result not found' }, { status: 404 });
  if (existing.status === 'published') return NextResponse.json({ error: 'Published result cannot be resubmitted' }, { status: 409 });

  const resolvedCa = caScore ?? Number(existing.ca_score);
  const resolvedExam = examScore ?? Number(existing.exam_score);
  const total = resolvedCa + resolvedExam;
  const graded = scoreToGrade(total);

  db.prepare(
    `UPDATE results
     SET ca_score = ?, exam_score = ?, total_score = ?, grade = ?, grade_point = ?,
         status = 'submitted', submitted_by = ?, submitted_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(resolvedCa, resolvedExam, total, graded.grade, graded.point, guard.auth.user.id, resultId);

  writeAudit('Result submitted', resultId, {
    submitted_by: guard.auth.user.id,
    ca_score: resolvedCa,
    exam_score: resolvedExam,
    total_score: total,
    grade: graded.grade,
  });

  return NextResponse.json({ ok: true, id: resultId, status: 'submitted' });
}

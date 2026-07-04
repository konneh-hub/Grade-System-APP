import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { readResult, requireAuthRole, scoreToGrade, writeAudit } from '@/app/api/results/_shared';

type ParamsContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: ParamsContext) {
  const guard = requireAuthRole(req, ['admin', 'lecturer', 'hod', 'dean', 'exam_officer']);
  if ('error' in guard) return guard.error;

  const { id } = await context.params;
  const resultId = Number(id);
  if (!Number.isFinite(resultId)) return NextResponse.json({ error: 'Invalid result id' }, { status: 400 });

  const row = readResult(resultId);
  if (!row) return NextResponse.json({ error: 'Result not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(req: Request, context: ParamsContext) {
  const guard = requireAuthRole(req, ['lecturer', 'admin']);
  if ('error' in guard) return guard.error;

  const { id } = await context.params;
  const resultId = Number(id);
  if (!Number.isFinite(resultId)) return NextResponse.json({ error: 'Invalid result id' }, { status: 400 });

  const body = (await req.json()) as Record<string, unknown>;
  const db = getDatabase();
  const existing = readResult(resultId);
  if (!existing) return NextResponse.json({ error: 'Result not found' }, { status: 404 });

  const caScore = body.ca_score != null ? Number(body.ca_score) : Number(existing.ca_score ?? 0);
  const examScore = body.exam_score != null ? Number(body.exam_score) : Number(existing.exam_score ?? 0);
  const total = caScore + examScore;
  const graded = scoreToGrade(total);

  db.prepare(
    `UPDATE results
     SET ca_score = ?, exam_score = ?, total_score = ?, grade = ?, grade_point = ?,
         status = CASE WHEN status IN ('approved','published') THEN status ELSE 'draft' END
     WHERE id = ?`
  ).run(caScore, examScore, total, graded.grade, graded.point, resultId);

  writeAudit('Result score updated', resultId, {
    ca_score: caScore,
    exam_score: examScore,
    total_score: total,
    grade: graded.grade,
    grade_point: graded.point,
  });

  return NextResponse.json({ ok: true, id: resultId });
}

export async function DELETE(req: Request, context: ParamsContext) {
  const guard = requireAuthRole(req, ['admin']);
  if ('error' in guard) return guard.error;

  const { id } = await context.params;
  const resultId = Number(id);
  if (!Number.isFinite(resultId)) return NextResponse.json({ error: 'Invalid result id' }, { status: 400 });

  const db = getDatabase();
  const row = readResult(resultId);
  if (!row) return NextResponse.json({ error: 'Result not found' }, { status: 404 });
  if (String(row.status) === 'published') return NextResponse.json({ error: 'Cannot delete published result' }, { status: 409 });

  db.prepare('DELETE FROM results WHERE id = ?').run(resultId);
  writeAudit('Result deleted', resultId, { previous_status: row.status });
  return NextResponse.json({ ok: true });
}

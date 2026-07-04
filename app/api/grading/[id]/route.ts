import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';

type ParamsContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: ParamsContext) {
  const { id } = await context.params;
  const configId = Number(id);
  if (!Number.isFinite(configId)) return NextResponse.json({ error: 'Invalid grading config id' }, { status: 400 });

  const body = (await req.json()) as Record<string, unknown>;
  const db = getDatabase();
  const existing = db.prepare('SELECT id FROM grading_configurations WHERE id = ?').get(configId) as { id: number } | null;
  if (!existing) return NextResponse.json({ error: 'Grading configuration not found' }, { status: 404 });

  db.prepare(
    `UPDATE grading_configurations
     SET department_id = COALESCE(?, department_id),
         academic_session_id = COALESCE(?, academic_session_id),
         grade_scale = COALESCE(?, grade_scale),
         pass_mark = COALESCE(?, pass_mark),
         ca_weight = COALESCE(?, ca_weight),
         exam_weight = COALESCE(?, exam_weight)
     WHERE id = ?`
  ).run(
    body.department_id != null ? Number(body.department_id) : null,
    body.academic_session_id != null ? Number(body.academic_session_id) : null,
    body.grade_scale != null ? String(body.grade_scale) : null,
    body.pass_mark != null ? Number(body.pass_mark) : null,
    body.ca_weight != null ? Number(body.ca_weight) : null,
    body.exam_weight != null ? Number(body.exam_weight) : null,
    configId
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, context: ParamsContext) {
  const { id } = await context.params;
  const configId = Number(id);
  if (!Number.isFinite(configId)) return NextResponse.json({ error: 'Invalid grading config id' }, { status: 400 });

  const db = getDatabase();
  const result = db.prepare('DELETE FROM grading_configurations WHERE id = ?').run(configId) as { changes?: number };
  if (!result.changes) return NextResponse.json({ error: 'Grading configuration not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

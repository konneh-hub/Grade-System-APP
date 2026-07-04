import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { readResult, requireAuthRole, writeAudit } from '@/app/api/results/_shared';

type ParamsContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: ParamsContext) {
  const guard = requireAuthRole(req, ['hod', 'dean']);
  if ('error' in guard) return guard.error;

  const { id } = await context.params;
  const resultId = Number(id);
  if (!Number.isFinite(resultId)) return NextResponse.json({ error: 'Invalid result id' }, { status: 400 });

  const body = (await req.json()) as { reason?: string };
  const db = getDatabase();
  const row = readResult(resultId);
  if (!row) return NextResponse.json({ error: 'Result not found' }, { status: 404 });

  if (!['submitted', 'approved'].includes(String(row.status))) {
    return NextResponse.json({ error: 'Only submitted/approved results can be rejected' }, { status: 409 });
  }

  db.prepare(
    `UPDATE results
     SET status = 'draft', approved_by = NULL, approved_at = NULL
     WHERE id = ?`
  ).run(resultId);

  writeAudit('Result rejected', resultId, { rejected_by: guard.auth.user.id, reason: body.reason ?? null });
  return NextResponse.json({ ok: true, id: resultId, status: 'draft' });
}

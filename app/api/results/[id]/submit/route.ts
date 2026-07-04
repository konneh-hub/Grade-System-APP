import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { readResult, requireAuthRole, writeAudit } from '@/app/api/results/_shared';

type ParamsContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: ParamsContext) {
  const guard = requireAuthRole(req, ['lecturer']);
  if ('error' in guard) return guard.error;

  const { id } = await context.params;
  const resultId = Number(id);
  if (!Number.isFinite(resultId)) return NextResponse.json({ error: 'Invalid result id' }, { status: 400 });

  const db = getDatabase();
  const row = readResult(resultId);
  if (!row) return NextResponse.json({ error: 'Result not found' }, { status: 404 });
  if (String(row.status) === 'published') return NextResponse.json({ error: 'Published result cannot be resubmitted' }, { status: 409 });

  db.prepare(
    `UPDATE results
     SET status = 'submitted', submitted_by = ?, submitted_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(guard.auth.user.id, resultId);

  writeAudit('Result submitted', resultId, { submitted_by: guard.auth.user.id });
  return NextResponse.json({ ok: true, id: resultId, status: 'submitted' });
}

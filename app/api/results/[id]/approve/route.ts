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

  const db = getDatabase();
  const row = readResult(resultId);
  if (!row) return NextResponse.json({ error: 'Result not found' }, { status: 404 });
  if (String(row.status) !== 'submitted') return NextResponse.json({ error: 'Only submitted results can be approved' }, { status: 409 });

  db.prepare(
    `UPDATE results
     SET status = 'approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(guard.auth.user.id, resultId);

  writeAudit('Result approved', resultId, { approved_by: guard.auth.user.id, role: guard.auth.roles.join(',') });
  return NextResponse.json({ ok: true, id: resultId, status: 'approved' });
}

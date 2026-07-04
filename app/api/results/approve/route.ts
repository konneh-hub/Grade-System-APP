import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuthRole, writeAudit } from '@/app/api/results/_shared';

export async function POST(req: Request) {
  const guard = requireAuthRole(req, ['hod', 'dean']);
  if ('error' in guard) return guard.error;

  const body = (await req.json()) as { result_id?: number };
  const resultId = Number(body.result_id ?? 0);
  if (!Number.isFinite(resultId) || resultId <= 0) {
    return NextResponse.json({ error: 'result_id is required' }, { status: 400 });
  }

  const db = getDatabase();
  const existing = db.prepare('SELECT id, status FROM results WHERE id = ?').get(resultId) as { id: number; status: string } | null;
  if (!existing) return NextResponse.json({ error: 'Result not found' }, { status: 404 });
  if (existing.status !== 'submitted') return NextResponse.json({ error: 'Only submitted results can be approved' }, { status: 409 });

  db.prepare('UPDATE results SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP WHERE id = ?').run('approved', guard.auth.user.id, resultId);
  writeAudit('Result approved', resultId, { approved_by: guard.auth.user.id, role: guard.auth.roles.join(',') });

  return NextResponse.json({ ok: true, id: resultId, status: 'approved' });
}


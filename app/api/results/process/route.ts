import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuthRole, writeAudit } from '@/app/api/results/_shared';

export async function POST(req: Request) {
  const guard = requireAuthRole(req, ['exam_officer']);
  if ('error' in guard) return guard.error;

  const body = (await req.json()) as { result_id?: number; action?: string };
  const resultId = Number(body.result_id ?? 0);
  const action = String(body.action ?? '').trim().toLowerCase();
  if (!Number.isFinite(resultId) || resultId <= 0 || !action) {
    return NextResponse.json({ error: 'result_id and action are required' }, { status: 400 });
  }

  const db = getDatabase();
  const existing = db.prepare('SELECT id, status FROM results WHERE id = ?').get(resultId) as { id: number; status: string } | null;
  if (!existing) return NextResponse.json({ error: 'Result not found' }, { status: 404 });

  const allowedTransitions: Record<string, string> = {
    publish: 'published',
    unpublish: 'approved',
    lock: 'approved',
  };

  const nextStatus = allowedTransitions[action];
  if (!nextStatus) {
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  }

  if (action === 'publish' && existing.status !== 'approved') {
    return NextResponse.json({ error: 'Only approved results can be published' }, { status: 409 });
  }
  if (action === 'unpublish' && existing.status !== 'published') {
    return NextResponse.json({ error: 'Only published results can be unpublished' }, { status: 409 });
  }

  db.prepare('UPDATE results SET status = ? WHERE id = ?').run(nextStatus, resultId);
  writeAudit(`Result process action: ${action}`, resultId, { processed_by: guard.auth.user.id, from: existing.status, to: nextStatus });

  return NextResponse.json({ ok: true, id: resultId, status: nextStatus });
}

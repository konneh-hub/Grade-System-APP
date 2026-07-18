import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

type ParamsContext = { params: Promise<{ id: string }> };

export async function GET(req: Request, context: ParamsContext) {
  const guard = requireAuth(req);
  if ('error' in guard) return guard.error;
  const { id } = await context.params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });

  const db = getDatabase();
  const row = db.prepare('SELECT id, status FROM users WHERE id = ?').get(userId) as { id: number; status: string } | null;
  if (!row) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: Request, context: ParamsContext) {
  const guard = requireAuth(req);
  if ('error' in guard) return guard.error;
  const { id } = await context.params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });

  const body = (await req.json()) as { status?: string; reason?: string; immediateLogout?: boolean };
  const nextStatus = String(body.status ?? '').toLowerCase();
  if (!nextStatus || !['active', 'suspended', 'pending', 'inactive'].includes(nextStatus)) {
    return NextResponse.json({ error: 'Valid status is required' }, { status: 400 });
  }

  const db = getDatabase();
  const exists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as { id: number } | null;
  if (!exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(nextStatus, userId);

  db.prepare(
    `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details, created_at)
     VALUES (NULL, ?, 'users', ?, ?, CURRENT_TIMESTAMP)`
  ).run(
    `User status changed to ${nextStatus}`,
    userId,
    JSON.stringify({ reason: body.reason ?? null, immediateLogout: Boolean(body.immediateLogout) })
  );

  return NextResponse.json({ ok: true, id: userId, status: nextStatus });
}

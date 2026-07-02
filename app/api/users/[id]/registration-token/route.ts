import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { getUserFromRequest } from '@/lib/middleware/auth';

function generateRegistrationToken(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < length; i += 1) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

const TOKEN_TTL_HOURS = 72;

type ParamsContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: ParamsContext) {
  const auth = getUserFromRequest(req);
  if (!auth || !auth.roles.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  const db = getDatabase();
  const user = db.prepare('SELECT id, status FROM users WHERE id = ?').get(userId) as { id: number; status: string } | null;
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const token = generateRegistrationToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString();

  db.prepare(
    `UPDATE users
     SET registration_token = ?, registration_requested_at = CURRENT_TIMESTAMP, status = CASE WHEN status = 'active' THEN 'pending' ELSE status END, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(token, userId);

  return NextResponse.json({
    ok: true,
    registration_token: token,
    registration_expires_at: expiresAt,
  });
}

import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { getDatabase } from '@/lib/config/database';
import { hashPassword } from '@/lib/utils/crypto';
import { getUserByEmail } from '@/lib/services/user.service';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

const PASSWORD_RESET_TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

function ensurePasswordResetRequestsTable(db: ReturnType<typeof getDatabase>) {
  db.exec(
    `CREATE TABLE IF NOT EXISTS password_reset_requests (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       token TEXT UNIQUE NOT NULL,
       requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
       used_at TEXT
     )`
  );
}

function generateResetToken() {
  return randomBytes(24).toString('hex');
}

function isResetTokenExpired(requestedAt: string | null | undefined) {
  if (!requestedAt) return true;
  const timestamp = Date.parse(requestedAt);
  if (Number.isNaN(timestamp)) return true;
  return Date.now() - timestamp > PASSWORD_RESET_TOKEN_TTL_MS;
}

export async function GET(req: Request) {
  const guard = requireAuth(req);
  if ('error' in guard) return guard.error;
  const url = new URL(req.url);
  const token = String(url.searchParams.get('token') ?? '').trim();
  if (!token) {
    return NextResponse.json({ valid: false, error: 'Reset token is required' }, { status: 400 });
  }

  const db = getDatabase();
  ensurePasswordResetRequestsTable(db);

  const row = db
    .prepare(
      `SELECT pr.id, pr.user_id, pr.token, pr.requested_at, pr.used_at, u.email, u.first_name
       FROM password_reset_requests pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.token = ?`
    )
    .get(token) as Record<string, unknown> | null;

  if (!row || row.used_at != null || isResetTokenExpired(String(row.requested_at ?? null))) {
    return NextResponse.json({ valid: false, error: 'Reset token is invalid or expired' }, { status: 400 });
  }

  return NextResponse.json({ valid: true, email: String(row.email ?? ''), firstName: String(row.first_name ?? '') });
}

export async function POST(req: Request) {
  const guard = requireAuth(req);
  if ('error' in guard) return guard.error;
  try {
    const body = await req.json();
    const action = String(body.action ?? '').trim().toLowerCase();
    const db = getDatabase();
    ensurePasswordResetRequestsTable(db);

    if (action === 'request') {
      const email = typeof body.email === 'string' ? body.email.trim() : '';
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }

      const user = getUserByEmail(email);
      if (user && user.status === 'active') {
        db.prepare('UPDATE password_reset_requests SET used_at = CURRENT_TIMESTAMP WHERE user_id = ? AND used_at IS NULL').run(user.id);
        const token = generateResetToken();
        db.prepare('INSERT INTO password_reset_requests (user_id, token, requested_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run(user.id, token);
        // Email disabled: return the token so client can navigate to reset page.
        return NextResponse.json({ ok: true, token });
      }

      return NextResponse.json({ ok: true });
    }

    if (action === 'confirm') {
      const token = typeof body.token === 'string' ? body.token.trim() : '';
      const password = typeof body.password === 'string' ? body.password : '';
      if (!token || !password) {
        return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
      }
      if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }

      const row = db
        .prepare(
          `SELECT pr.id, pr.user_id, pr.requested_at, pr.used_at, u.status
           FROM password_reset_requests pr
           JOIN users u ON u.id = pr.user_id
           WHERE pr.token = ?`
        )
        .get(token) as Record<string, unknown> | null;

      if (!row || row.used_at != null || isResetTokenExpired(String(row.requested_at ?? null))) {
        return NextResponse.json({ error: 'Reset token is invalid or expired' }, { status: 400 });
      }

      const userId = Number(row.user_id ?? 0);
      if (!Number.isFinite(userId) || userId <= 0) {
        return NextResponse.json({ error: 'Invalid reset token' }, { status: 400 });
      }

      const passwordHash = await hashPassword(password);
      db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(passwordHash, userId);
      db.prepare('UPDATE password_reset_requests SET used_at = CURRENT_TIMESTAMP WHERE id = ?').run(Number(row.id ?? 0));
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error }, { status: 500 });
  }
}

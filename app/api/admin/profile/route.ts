import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { getUserFromRequest } from '@/lib/middleware/auth';

function ensureProfileColumns() {
  const db = getDatabase();
  const cols = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>;
  const names = new Set(cols.map((col) => col.name));
  if (!names.has('mfa_enabled')) {
    db.exec('ALTER TABLE users ADD COLUMN mfa_enabled INTEGER DEFAULT 0');
  }
}

export async function GET(req: Request) {
  ensureProfileColumns();
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDatabase();
  const user = db
    .prepare('SELECT id, email, first_name, last_name, phone, avatar_url, mfa_enabled, last_login_at, created_at FROM users WHERE id = ?')
    .get(auth.user.id);

  const recentLogins = db
    .prepare(
      `SELECT id, action, ip_address, created_at
       FROM audit_logs
       WHERE actor_id = ? AND LOWER(action) LIKE '%login%'
       ORDER BY datetime(created_at) DESC
       LIMIT 20`
    )
    .all(auth.user.id);

  return NextResponse.json({ ...user, recent_logins: recentLogins });
}

export async function PATCH(req: Request) {
  ensureProfileColumns();
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as Record<string, unknown>;
  const db = getDatabase();

  db.prepare(
    `UPDATE users
     SET first_name = COALESCE(?, first_name),
         last_name = COALESCE(?, last_name),
         phone = COALESCE(?, phone),
         avatar_url = COALESCE(?, avatar_url),
         mfa_enabled = COALESCE(?, mfa_enabled),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(
    body.first_name != null ? String(body.first_name).trim() : null,
    body.last_name != null ? String(body.last_name).trim() : null,
    body.phone != null ? String(body.phone).trim() : null,
    body.avatar_url != null ? String(body.avatar_url).trim() : null,
    body.mfa_enabled != null ? (Boolean(body.mfa_enabled) ? 1 : 0) : null,
    auth.user.id
  );

  return NextResponse.json({ ok: true });
}

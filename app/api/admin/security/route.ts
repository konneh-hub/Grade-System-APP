import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';

export async function GET() {
  const db = getDatabase();

  const activeUsers = (db.prepare('SELECT COUNT(*) AS count FROM users WHERE status = \"active\"').get() as { count: number } | null)?.count ?? 0;
  const blockedUsers = (db.prepare('SELECT COUNT(*) AS count FROM users WHERE status = \"suspended\"').get() as { count: number } | null)?.count ?? 0;
  const failedLogins24h = (db.prepare(`SELECT COUNT(*) AS count FROM audit_logs WHERE LOWER(action) LIKE '%failed%' AND datetime(created_at) >= datetime('now', '-1 day')`).get() as { count: number } | null)?.count ?? 0;
  const suspiciousActivities = (db.prepare(`SELECT COUNT(*) AS count FROM audit_logs WHERE LOWER(action) LIKE '%suspicious%' AND datetime(created_at) >= datetime('now', '-7 day')`).get() as { count: number } | null)?.count ?? 0;

  const recentLogins = db
    .prepare(
      `SELECT id, action, entity_type, ip_address, created_at
       FROM audit_logs
       WHERE LOWER(action) LIKE '%login%'
       ORDER BY datetime(created_at) DESC
       LIMIT 20`
    )
    .all();

  return NextResponse.json({
    metrics: {
      active_users: activeUsers,
      blocked_users: blockedUsers,
      failed_logins_24h: failedLogins24h,
      suspicious_activities_7d: suspiciousActivities,
    },
    recent_logins: recentLogins,
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { action?: string; user_id?: number; reason?: string };
  const action = String(body.action ?? '').trim().toLowerCase();
  const userId = Number(body.user_id ?? 0);

  if (!action || !Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json({ error: 'action and valid user_id are required' }, { status: 400 });
  }

  const db = getDatabase();
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as { id: number } | null;
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (action === 'unblock' || action === 'activate') {
    db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('active', userId);
  } else if (action === 'suspend' || action === 'block') {
    db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('suspended', userId);
  } else if (action === 'force_password_reset') {
    db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('pending', userId);
  } else if (action === 'force_logout') {
    db.prepare('UPDATE users SET last_login_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(userId);
  } else {
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  }

  db.prepare(
    `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, details, created_at)
     VALUES (NULL, ?, 'users', ?, ?, CURRENT_TIMESTAMP)`
  ).run(`Security action: ${action}`, userId, JSON.stringify({ reason: body.reason ?? null }));

  return NextResponse.json({ ok: true, action, user_id: userId });
}

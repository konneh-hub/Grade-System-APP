import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { getUserFromRequest } from '@/lib/middleware/auth';

type ParamsContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: ParamsContext) {
  const { id } = await context.params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });

  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT r.id, r.name, r.description
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = ?
       ORDER BY r.name ASC`
    )
    .all(userId);

  return NextResponse.json(rows);
}

export async function PUT(req: Request, context: ParamsContext) {
  const auth = getUserFromRequest(req);
  if (!auth || !auth.roles.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });

  const body = (await req.json()) as { roles?: string[] };
  const roles = Array.isArray(body.roles) ? body.roles.map((item) => String(item).trim()).filter(Boolean) : [];
  if (roles.length === 0) return NextResponse.json({ error: 'roles array is required' }, { status: 400 });

  const db = getDatabase();
  const roleRows = db
    .prepare(`SELECT id, name FROM roles WHERE name IN (${roles.map(() => '?').join(',')})`)
    .all(...roles) as Array<{ id: number; name: string }>;

  if (roleRows.length === 0) return NextResponse.json({ error: 'No valid roles found' }, { status: 400 });

  if (roleRows.some((item) => item.name === 'lecturer')) {
    return NextResponse.json({ error: 'Lecturer assignment is restricted to HoD workflow' }, { status: 403 });
  }

  db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(userId);
  for (const role of roleRows) {
    db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)').run(userId, role.id);
  }

  return NextResponse.json({ ok: true, roles: roleRows.map((item) => item.name) });
}

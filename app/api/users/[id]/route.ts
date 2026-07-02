import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { getUserFromRequest } from '@/lib/middleware/auth';

type ParamsContext = { params: Promise<{ id: string }> };
const STAFF_TOKEN_ROLES = new Set(['hod', 'dean', 'exam_officer', 'exam-officer', 'lecturer']);

function generateRegistrationToken(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < length; i += 1) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export async function GET(_req: Request, context: ParamsContext) {
  const { id } = await context.params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });

  const db = getDatabase();
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.status, u.registered_at, u.last_login_at,
              GROUP_CONCAT(r.name, ',') AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.id = ?
       GROUP BY u.id`
    )
    .get(userId) as Record<string, unknown> | null;

  if (!row) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({
    ...row,
    roles: typeof row.roles === 'string' && row.roles.length > 0 ? String(row.roles).split(',') : [],
  });
}

export async function PATCH(req: Request, context: ParamsContext) {
  const auth = getUserFromRequest(req);
  if (!auth || !auth.roles.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });

  const body = (await req.json()) as Record<string, unknown>;
  const db = getDatabase();

  const exists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as { id: number } | null;
  if (!exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const currentRoles = db
    .prepare(
      `SELECT r.name AS role
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = ?`
    )
    .all(userId) as Array<{ role: string }>;

  const roleFromBody = body.role != null ? String(body.role) : null;
  const normalizedRole = roleFromBody === 'exam-officer' ? 'exam_officer' : roleFromBody;

  if (normalizedRole) {
    const roleRow = db.prepare('SELECT id FROM roles WHERE name = ?').get(normalizedRole) as { id: number } | null;
    if (roleRow) {
      db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(userId);
      db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)').run(userId, roleRow.id);
      currentRoles.length = 0;
      currentRoles.push({ role: normalizedRole });
    }
  }

  const effectiveRole = currentRoles[0]?.role ?? 'student';
  const isStudentRole = effectiveRole === 'student';
  const isStaffTokenRole = STAFF_TOKEN_ROLES.has(effectiveRole);
  const studentId = String(body.student_id ?? body.external_id ?? body.externalId ?? '').trim();
  const faculty = String(body.faculty ?? '').trim();
  const department = String(body.department ?? '').trim();
  const academicLevel = String(body.academic_level ?? body.academicLevel ?? '').trim().toLowerCase();
  const shouldReopenRegistration = Boolean(body.reopen_registration) || isStudentRole || isStaffTokenRole;

  if (isStudentRole && shouldReopenRegistration) {
    const validLevels = new Set(['year1', 'year2', 'year3', 'year4', 'year5']);
    if (!studentId || !faculty || !department || !validLevels.has(academicLevel)) {
      return NextResponse.json(
        { error: 'student_id, faculty, department, and academic_level (year1-year5) are required when updating student registration data' },
        { status: 400 }
      );
    }
  }

  const registrationToken = isStaffTokenRole && shouldReopenRegistration ? generateRegistrationToken() : null;

  db.prepare(
    `UPDATE users
     SET first_name = COALESCE(?, first_name),
         last_name = COALESCE(?, last_name),
         phone = COALESCE(?, phone),
         status = CASE WHEN ? = 1 THEN 'pending' ELSE COALESCE(?, status) END,
         registration_token = CASE WHEN ? = 1 THEN ? ELSE registration_token END,
         registration_requested_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE registration_requested_at END,
         avatar_url = CASE WHEN ? = 1 THEN ? ELSE avatar_url END,
         registered_at = CASE WHEN ? = 1 THEN NULL ELSE registered_at END,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(
    body.first_name != null ? String(body.first_name) : null,
    body.last_name != null ? String(body.last_name) : null,
    body.phone != null ? String(body.phone) : null,
    shouldReopenRegistration ? 1 : 0,
    body.status != null ? String(body.status) : null,
    shouldReopenRegistration ? 1 : 0,
    registrationToken,
    shouldReopenRegistration ? 1 : 0,
    isStudentRole && shouldReopenRegistration ? 1 : 0,
    isStudentRole && shouldReopenRegistration
      ? JSON.stringify({ student_id: studentId, faculty, department, academic_level: academicLevel })
      : null,
    shouldReopenRegistration ? 1 : 0,
    userId
  );

  return NextResponse.json({
    ok: true,
    registration_token: registrationToken,
    registration_expires_at:
      registrationToken != null ? new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() : null,
  });
}

export async function DELETE(_req: Request, context: ParamsContext) {
  const { id } = await context.params;
  const userId = Number(id);
  if (!Number.isFinite(userId)) return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });

  const db = getDatabase();
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId) as { changes?: number };
  if (!result.changes) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

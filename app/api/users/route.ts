import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { hashPassword } from '@/lib/utils/crypto';
import { getUserFromRequest } from '@/lib/middleware/auth';

type RoleRow = { role: string };
const STAFF_TOKEN_ROLES = new Set(['hod', 'dean', 'exam_officer', 'exam-officer', 'lecturer']);
const TOKEN_TTL_HOURS = 72;

function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i += 1) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

function generateRegistrationToken(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < length; i += 1) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export async function GET() {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.status, u.registered_at, u.last_login_at,
              GROUP_CONCAT(r.name, ',') AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       GROUP BY u.id
       ORDER BY u.id ASC`
    )
    .all() as Array<Record<string, unknown>>;

  const normalized = rows.map((row) => ({
    ...row,
    roles: typeof row.roles === 'string' && row.roles.length > 0 ? String(row.roles).split(',') : [],
  }));

  return NextResponse.json(normalized);
}

export async function POST(req: Request) {
  const auth = getUserFromRequest(req);
  if (!auth || !auth.roles.includes('admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const db = getDatabase();

  const email = String(body.email ?? '').trim().toLowerCase();
  const firstName = String(body.first_name ?? body.firstName ?? '').trim();
  const lastName = String(body.last_name ?? body.lastName ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const role = String(body.role ?? 'student').trim();
  const normalizedRole = role === 'exam-officer' ? 'exam_officer' : role;
  const status = String(body.status ?? 'active').trim().toLowerCase();
  const requestedPassword = String(body.password ?? '').trim();
  const isStaffTokenRole = STAFF_TOKEN_ROLES.has(normalizedRole);
  const isStudentRole = normalizedRole === 'student';
  const shouldGenerateRegistrationToken = isStaffTokenRole;
  const password = requestedPassword || ((shouldGenerateRegistrationToken || isStudentRole) ? '' : generatePassword());
  const registrationToken = shouldGenerateRegistrationToken ? generateRegistrationToken() : null;
  const normalizedStatus = (shouldGenerateRegistrationToken || isStudentRole) ? 'pending' : status || 'active';

  const studentId = String(body.student_id ?? body.external_id ?? body.externalId ?? '').trim();
  const academicLevel = String(body.academic_level ?? body.academicLevel ?? '').trim().toLowerCase();
  const faculty = String(body.faculty ?? '').trim();
  const department = String(body.department ?? '').trim();

  if (isStudentRole) {
    const validLevels = new Set(['year1', 'year2', 'year3', 'year4', 'year5']);
    if (!studentId || !faculty || !department || !validLevels.has(academicLevel)) {
      return NextResponse.json(
        { error: 'student_id, faculty, department, and academic_level (year1-year5) are required for student provisioning' },
        { status: 400 }
      );
    }
  }

  if (!email || !firstName || !lastName) {
    return NextResponse.json({ error: 'email, first_name, and last_name are required' }, { status: 400 });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number } | null;
  if (existing) {
    return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
  }

  const passwordHash = password ? await hashPassword(password) : '';
  const result = db
    .prepare(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, status, registration_token, registration_requested_at, registered_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CASE WHEN ? IS NOT NULL THEN CURRENT_TIMESTAMP ELSE NULL END, CASE WHEN ? = 'active' THEN CURRENT_TIMESTAMP ELSE NULL END, CURRENT_TIMESTAMP)`
    )
    .run(
      email,
      passwordHash,
      firstName,
      lastName,
      phone || null,
      normalizedStatus,
      registrationToken,
      registrationToken,
      normalizedStatus
    ) as { lastInsertRowid: number };

  const userId = Number(result.lastInsertRowid);

  const roleRow = db.prepare('SELECT id FROM roles WHERE name = ?').get(normalizedRole) as { id: number } | null;
  if (roleRow) {
    db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)').run(userId, roleRow.id);
  }

  if (isStudentRole) {
    db.prepare(
      `UPDATE users
       SET avatar_url = ?, registration_requested_at = COALESCE(registration_requested_at, CURRENT_TIMESTAMP)
       WHERE id = ?`
    ).run(JSON.stringify({ student_id: studentId, faculty, department, academic_level: academicLevel }), userId);
  }

  const assignedRoles = db
    .prepare(
      `SELECT r.name AS role
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = ?`
    )
    .all(userId) as RoleRow[];

  return NextResponse.json(
    {
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      status: normalizedStatus,
      roles: assignedRoles.map((item) => item.role),
      generated_password: requestedPassword || shouldGenerateRegistrationToken || isStudentRole ? null : password,
      registration_token: registrationToken,
      registration_expires_at: registrationToken
        ? new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000).toISOString()
        : null,
    },
    { status: 201 }
  );
}

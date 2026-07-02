import { getUserByEmail, getUserById, getUserRoles } from '@/lib/services/user.service';
import { verifyPassword, signToken, hashPassword } from '@/lib/utils/crypto';
import { getDatabase } from '@/lib/config/database';

export interface RegisterPayload {
  email: string;
  password: string;
  registration_token?: string;
  student_id?: string;
  full_name?: string;
  faculty?: string;
  department?: string;
  academic_level?: string;
}

export interface TokenPayload {
  userId: number;
  email: string;
  roles: string[];
}

export async function registerUser(payload: RegisterPayload) {
  const existing = getUserByEmail(payload.email);
  if (!existing) throw new Error('Account is not provisioned or already registered');
  if (existing.status !== 'pending') throw new Error('Account already registered');
  if (!existing.registration_requested_at) {
    throw new Error('Registration is disabled for this account. Ask admin to create or update your information first');
  }
  const roles = getUserRoles(existing.id);
  const isStudent = roles.includes('student');

  if (isStudent) {
    const profile = existing.avatar_url ? (JSON.parse(existing.avatar_url) as Record<string, unknown>) : null;
    const expectedFullName = `${existing.first_name} ${existing.last_name}`.trim().toLowerCase();
    const providedFullName = String(payload.full_name ?? '').trim().toLowerCase();
    const expectedStudentId = String(profile?.student_id ?? '').trim().toLowerCase();
    const expectedFaculty = String(profile?.faculty ?? '').trim().toLowerCase();
    const expectedDepartment = String(profile?.department ?? '').trim().toLowerCase();
    const expectedLevel = String(profile?.academic_level ?? '').trim().toLowerCase();

    if (!payload.student_id || !payload.full_name || !payload.faculty || !payload.department || !payload.academic_level) {
      throw new Error('Student registration requires student_id, full_name, faculty, department, and academic_level');
    }

    if (providedFullName !== expectedFullName) throw new Error('Full name does not match the provisioned record');
    if (String(payload.student_id).trim().toLowerCase() !== expectedStudentId) throw new Error('Student ID does not match the provisioned record');
    if (String(payload.faculty).trim().toLowerCase() !== expectedFaculty) throw new Error('Faculty does not match the provisioned record');
    if (String(payload.department).trim().toLowerCase() !== expectedDepartment) throw new Error('Department does not match the provisioned record');
    if (String(payload.academic_level).trim().toLowerCase() !== expectedLevel) throw new Error('Academic level does not match the provisioned record');
  } else {
    if (!payload.registration_token || payload.registration_token !== existing.registration_token) {
      throw new Error('Invalid registration token');
    }

    if (!existing.registration_requested_at) {
      throw new Error('Registration token is invalid or expired');
    }

    const requestedAt = new Date(existing.registration_requested_at).getTime();
    const expiresAt = requestedAt + 72 * 60 * 60 * 1000;
    if (Number.isNaN(requestedAt) || Date.now() > expiresAt) {
      throw new Error('Registration token has expired. Ask admin to regenerate token');
    }
  }

  const password_hash = await hashPassword(payload.password);
  const db = getDatabase();
  db.prepare(
    'UPDATE users SET password_hash = ?, status = ?, registered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, registration_token = NULL WHERE id = ?'
  ).run(password_hash, 'active', existing.id);

  const user = getUserById(existing.id);
  if (!user) {
    throw new Error('Failed to load registered user');
  }

  const updatedRoles = getUserRoles(existing.id);
  const token = signToken({
    userId: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    roles: updatedRoles,
  });
  return { user, roles: updatedRoles, token };
}

export async function loginUser(email: string, password: string) {
  const user = getUserByEmail(email);
  if (!user) return null;
  if (user.status !== 'active') return null;
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return null;
  const roles = getUserRoles(user.id);
  const token = signToken({
    userId: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    roles,
  });
  return { user, roles, token };
}

export function getUserFromTokenPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object' || !('userId' in payload)) return null;
  const payloadObj = payload as { userId?: string | number };
  if (!payloadObj.userId) return null;
  const user = getUserById(Number(payloadObj.userId));
  if (!user) return null;
  const roles = getUserRoles(user.id);
  return { user, roles };
}

export async function changePassword(userId: number, oldPassword: string, newPassword: string) {
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');
  const ok = await verifyPassword(oldPassword, user.password_hash);
  if (!ok) throw new Error('Current password is incorrect');
  const newHash = await hashPassword(newPassword);
  const db = getDatabase();
  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, userId);
  return true;
}

const authService = { registerUser, loginUser, getUserFromTokenPayload };
export default authService;

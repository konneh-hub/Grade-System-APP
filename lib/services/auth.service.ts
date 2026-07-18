import { getUserByEmail, getUserById, getUserRoles, createUser, type UserRow } from '@/lib/services/user.service';
import { verifyPassword, signToken, hashPassword } from '@/lib/utils/crypto';
import { prepare } from '@/lib/config/database';
import { config } from '@/lib/config/env';

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

export function createSessionToken(user: UserRow, roles: string[], rememberMe = false) {
  const expiresIn = rememberMe ? config.COOKIE_REMEMBER_ME_MAX_AGE : config.COOKIE_DEFAULT_MAX_AGE;
  return signToken({
    userId: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    roles,
    rememberMe,
  }, expiresIn);
}

export async function registerUser(payload: RegisterPayload) {
  const existing = getUserByEmail(payload.email);

  if (!existing) {
    // Open registration: create a new active user using provided details.
    const full = String(payload.full_name ?? payload.email.split('@')[0]).trim();
    const parts = full.split(/\s+/);
    const first = parts.shift() ?? '';
    const last = parts.join(' ') ?? '';
    const user = await createUser({ email: String(payload.email), password: String(payload.password), first_name: first, last_name: last });
    const roles = getUserRoles(user!.id);
    const token = createSessionToken(user as UserRow, roles, false);
    return { user, roles, token };
  }

  // Existing account: allow setting/updating password and activate account.
  const password_hash = await hashPassword(payload.password);
  prepare('UPDATE users SET password_hash = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(password_hash, 'active', existing.id);
  const user = getUserById(existing.id);
  if (!user) throw new Error('Failed to load registered user');
  const updatedRoles = getUserRoles(existing.id);
  const token = createSessionToken(user, updatedRoles, false);
  return { user, roles: updatedRoles, token };
}

export async function loginUser(email: string, password: string, rememberMe = false) {
  const user = getUserByEmail(email);
  if (!user) return null;
  if (user.status !== 'active') return null;
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return null;
  const roles = getUserRoles(user.id);
  const token = createSessionToken(user, roles, rememberMe);
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
  if (!oldPassword || !newPassword) throw new Error('Old password and new password are required');
  if (newPassword.length < 8) throw new Error('New password must be at least 8 characters');
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');
  const ok = await verifyPassword(oldPassword, user.password_hash);
  if (!ok) throw new Error('Current password is incorrect');
  const newHash = await hashPassword(newPassword);
  prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, userId);
  return true;
}

const authService = { registerUser, loginUser, getUserFromTokenPayload };
export default authService;

import { getUserByEmail, getUserById, getUserRoles, updateUserPassword } from '@/lib/services/user.service';
import { verifyPassword, signToken, hashPassword } from '@/lib/utils/crypto';
import { getDatabase } from '@/lib/config/database';

export async function registerUser(payload: any) {
  const existing = getUserByEmail(payload.email);
  if (!existing) throw new Error('Account is not provisioned or already registered');
  if (existing.status !== 'pending') throw new Error('Account already registered');
  if (!payload.registration_token || payload.registration_token !== existing.registration_token) {
    throw new Error('Invalid registration token');
  }

  const password_hash = await hashPassword(payload.password);
  const db = getDatabase();
  db.prepare(
    'UPDATE users SET password_hash = ?, status = ?, registered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP, registration_token = NULL WHERE id = ?'
  ).run(password_hash, 'active', existing.id);

  const user = getUserById(existing.id);
  const roles = getUserRoles(existing.id);
  const token = signToken({ userId: user.id, email: user.email, roles });
  return { user, roles, token };
}

export async function loginUser(email: string, password: string) {
  const user = getUserByEmail(email);
  if (!user) return null;
  if (user.status !== 'active') return null;
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return null;
  const roles = getUserRoles(user.id);
  const token = signToken({ userId: user.id, email: user.email, roles });
  return { user, roles, token };
}

export function getUserFromTokenPayload(payload: any) {
  if (!payload || !payload.userId) return null;
  const user = getUserById(Number(payload.userId));
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

export default { registerUser, loginUser, getUserFromTokenPayload };

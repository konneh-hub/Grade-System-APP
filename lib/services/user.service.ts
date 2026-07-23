import { prepare } from '@/lib/config/database';
import { hashPassword } from '@/lib/utils/crypto';

export interface CreateUserPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
}

export interface UserRow {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  password_hash: string;
  status: string;
  registration_token: string | null;
  registration_requested_at: string | null;
  provisioned_by: number | null;
  registered_at: string | null;
  updated_at: string | null;
}

export function getUserByEmail(email: string): UserRow | null {
  const row = prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | null;
  return row || null;
}

export function getUserById(id: number): UserRow | null {
  const row = prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | null;
  return row || null;
}

export async function provisionUser(payload: CreateUserPayload & { registration_token: string; status?: string; provisioned_by?: number | null }) {
  const password_hash = payload.password ? await hashPassword(payload.password) : '';
  prepare(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone, status, registration_token, provisioned_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  ).run(
    payload.email,
    password_hash,
    payload.first_name,
    payload.last_name,
    payload.phone || null,
    payload.status || 'pending',
    payload.registration_token,
    payload.provisioned_by || null
  );
  return getUserByEmail(payload.email);
}

export function getRoleIdByName(name: string): number | null {
  const row = prepare('SELECT id FROM roles WHERE name = ?').get(name) as { id: number } | null;
  return row ? row.id : null;
}

export function assignRoleToUser(userId: number, roleId: number) {
  prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)').run(userId, roleId);
}

export async function createUser(payload: CreateUserPayload): Promise<UserRow> {
  const password_hash = await hashPassword(payload.password);
  try {
    prepare(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, status, registered_at, updated_at) VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
    ).run(payload.email, password_hash, payload.first_name, payload.last_name, payload.phone || null);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/unique|constraint/i.test(message)) {
      throw new Error('An account with this email address already exists.');
    }
    throw error;
  }

  const user = getUserByEmail(payload.email);
  if (!user) throw new Error('Failed to create user');
  return user;
}

export function getUserRoles(userId: number) {
  const rows = prepare(
    `SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?`
  ).all(userId) as Array<{ name: string }>;
  return rows.map((r) => r.name);
}

export function updateUserPassword(userId: number, password_hash: string) {
  prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(password_hash, userId);
}

const userService = { getUserByEmail, createUser, getUserRoles, getUserById, provisionUser, getRoleIdByName, assignRoleToUser };
export default userService;

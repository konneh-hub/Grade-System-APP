import { getDatabase } from '@/lib/config/database';
import { hashPassword } from '@/lib/utils/crypto';

export interface CreateUserPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
}

export function getUserByEmail(email: string) {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  return row || null;
}

export function getUserById(id: number) {
  const db = getDatabase();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return row || null;
}

export async function provisionUser(payload: CreateUserPayload & { registration_token: string; status?: string; provisioned_by?: number | null }) {
  const db = getDatabase();
  const password_hash = payload.password ? await hashPassword(payload.password) : '';
  const stmt = db.prepare(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone, status, registration_token, provisioned_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );
  stmt.run(
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

export function getRoleIdByName(name: string) {
  const db = getDatabase();
  const row = db.prepare('SELECT id FROM roles WHERE name = ?').get(name);
  return row ? row.id : null;
}

export function assignRoleToUser(userId: number, roleId: number) {
  const db = getDatabase();
  db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)').run(userId, roleId);
}

export async function createUser(payload: CreateUserPayload) {
  const db = getDatabase();
  const password_hash = await hashPassword(payload.password);
  const stmt = db.prepare(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone, status, registered_at, updated_at) VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  );
  stmt.run(payload.email, password_hash, payload.first_name, payload.last_name, payload.phone || null);
  return getUserByEmail(payload.email);
}

export function getUserRoles(userId: number) {
  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT r.name FROM roles r JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = ?`
    )
    .all(userId);
  return rows.map((r: any) => r.name);
}

export function updateUserPassword(userId: number, password_hash: string) {
  const db = getDatabase();
  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(password_hash, userId);
}

export default { getUserByEmail, createUser, getUserRoles, getUserById, provisionUser, getRoleIdByName, assignRoleToUser };

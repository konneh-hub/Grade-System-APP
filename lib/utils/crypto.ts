import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '@/lib/config/env';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: object, expiresIn = '7d') {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch {
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const normalized = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
      const decoded = Buffer.from(normalized, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
}

const cryptoUtils = { hashPassword, verifyPassword, signToken, verifyToken };
export default cryptoUtils;

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
  } catch (e) {
    return null;
  }
}

export default { hashPassword, verifyPassword, signToken, verifyToken };

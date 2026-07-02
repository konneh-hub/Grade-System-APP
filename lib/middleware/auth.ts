import { verifyToken } from '@/lib/utils/crypto';
import { config } from '@/lib/config/env';
import type { NextRequest } from 'next/server';

interface TokenPayload {
  userId: number | string;
  email: string;
  first_name?: string;
  last_name?: string;
  roles: string[];
}

export function parseCookies(cookieHeader: string | null) {
  if (!cookieHeader) return {};
  return Object.fromEntries(cookieHeader.split(';').map(c => {
    const [k, ...v] = c.trim().split('=');
    return [k, decodeURIComponent(v.join('='))];
  }));
}

export function getUserFromRequest(req: Request | NextRequest) {
  const cookieHeader = typeof req.headers?.get === 'function' ? req.headers.get('cookie') : null;
  const cookies = parseCookies(cookieHeader);
  const nextCookieValue = typeof req === 'object' && req !== null && 'cookies' in req && typeof (req as NextRequest).cookies?.get === 'function'
    ? (req as NextRequest).cookies.get(config.COOKIE_NAME)?.value
    : null;
  const token = nextCookieValue || cookies[config.COOKIE_NAME];
  if (!token) return null;
  const payload = verifyToken(token as string) as TokenPayload | null;
  if (!payload || !payload.userId || !payload.roles) return null;
  const user = {
    id: Number(payload.userId),
    email: payload.email,
    first_name: payload.first_name || '',
    last_name: payload.last_name || '',
  };
  return { user, roles: payload.roles };
}

import { NextResponse } from 'next/server';
import { config } from '@/lib/config/env';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

export async function POST(req: Request) {
  const guard = requireAuth(req);
  if ('error' in guard) return guard.error;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(config.COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
    maxAge: 0,
  });
  return res;
}

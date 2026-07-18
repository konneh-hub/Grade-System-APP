import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/auth';
import { createSessionToken } from '@/lib/services/auth.service';
import { config } from '@/lib/config/env';

export async function GET(req: Request) {
  const info = getUserFromRequest(req);
  if (!info) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = createSessionToken(info.user as any, info.roles, info.rememberMe ?? false);

  const res = NextResponse.json({
    ok: true,
    user: {
      id: info.user.id,
      email: info.user.email,
      first_name: info.user.first_name,
      last_name: info.user.last_name,
    },
    roles: info.roles,
  });

  res.cookies.set(config.COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: info.rememberMe ? config.COOKIE_REMEMBER_ME_MAX_AGE : config.COOKIE_MAX_AGE,
  });

  return res;
}

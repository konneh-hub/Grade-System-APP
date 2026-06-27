import { NextResponse } from 'next/server';
import { config } from '@/lib/config/env';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(config.COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return res;
}

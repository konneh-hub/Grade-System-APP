import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/services/auth.service';
import { config } from '@/lib/config/env';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;
    const result = await loginUser(email, password);
    if (!result) return NextResponse.json({ error: 'Invalid credentials or account is not active' }, { status: 401 });
    const res = NextResponse.json({ user: { id: result.user.id, email: result.user.email, first_name: result.user.first_name, last_name: result.user.last_name }, roles: result.roles });
    res.cookies.set(config.COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: config.COOKIE_MAX_AGE,
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

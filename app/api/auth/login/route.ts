import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/services/auth.service';
import { config } from '@/lib/config/env';

export async function POST(req: Request) {
  try {
    let body: { email?: unknown; password?: unknown; rememberMe?: unknown };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const rememberMe = body.rememberMe === true || body.rememberMe === 'true';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const result = await loginUser(email, password, rememberMe);
    if (!result) return NextResponse.json({ error: 'Invalid credentials or account is not active' }, { status: 401 });

    const res = NextResponse.json({
      user: { id: result.user.id, email: result.user.email, first_name: result.user.first_name, last_name: result.user.last_name },
      roles: result.roles,
    });

    res.cookies.set(config.COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: rememberMe ? config.COOKIE_REMEMBER_ME_MAX_AGE : config.COOKIE_MAX_AGE,
    });

    // If the client prefers HTML (browser), redirect to the role dashboard
    const acceptHeader = typeof (req as Request).headers?.get === 'function' ? req.headers.get('accept') : null;
    if (acceptHeader && acceptHeader.includes('text/html')) {
      const role = Array.isArray(result.roles) && result.roles.length ? result.roles[0] : null;
      const rolePathMap: Record<string, string> = {
        admin: '/dashboard/admin',
        dean: '/dashboard/dean',
        hod: '/dashboard/hod',
        exam_officer: '/dashboard/exam-officer',
        lecturer: '/dashboard/lecturer',
        student: '/dashboard/student',
      };
      const path = role && rolePathMap[role] ? rolePathMap[role] : '/dashboard';
      const redirectRes = NextResponse.redirect(new URL(path, req.url));
      redirectRes.cookies.set(config.COOKIE_NAME, result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: rememberMe ? config.COOKIE_REMEMBER_ME_MAX_AGE : config.COOKIE_MAX_AGE,
      });
      return redirectRes;
    }

    return res;
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error }, { status: 500 });
  }
}

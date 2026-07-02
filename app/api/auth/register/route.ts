import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/services/auth.service';
import { config } from '@/lib/config/env';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, registration_token, student_id, full_name, faculty, department, academic_level } = body;
    const result = await registerUser({
      email,
      password,
      registration_token,
      student_id,
      full_name,
      faculty,
      department,
      academic_level,
    });
    const res = NextResponse.json({ user: { id: result.user.id, email: result.user.email, first_name: result.user.first_name, last_name: result.user.last_name }, roles: result.roles });
    res.cookies.set(config.COOKIE_NAME, result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: config.COOKIE_MAX_AGE,
    });
    return res;
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error }, { status: 400 });
  }
}

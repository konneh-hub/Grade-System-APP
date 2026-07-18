import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/auth';
import { changePassword } from '@/lib/services/auth.service';

export async function POST(req: Request) {
  try {
    const info = getUserFromRequest(req);
    if (!info) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const oldPassword = typeof body.oldPassword === 'string' ? body.oldPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Old password and new password are required' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    await changePassword(info.user.id, oldPassword, newPassword);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error }, { status: 400 });
  }
}

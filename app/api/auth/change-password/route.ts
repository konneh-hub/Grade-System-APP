import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/auth';
import { changePassword } from '@/lib/services/auth.service';

export async function POST(req: Request) {
  try {
    const info = getUserFromRequest(req);
    if (!info) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { oldPassword, newPassword } = body;
    await changePassword(info.user.id, oldPassword, newPassword);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 400 });
  }
}

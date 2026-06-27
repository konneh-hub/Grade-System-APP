import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/auth';

export async function GET(req: Request) {
  const info = getUserFromRequest(req);
  if (!info) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user: { id: info.user.id, email: info.user.email, first_name: info.user.first_name, last_name: info.user.last_name }, roles: info.roles });
}

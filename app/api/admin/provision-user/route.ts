import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/auth';
import { provisionUser, getRoleIdByName, assignRoleToUser } from '@/lib/services/user.service';

function createToken() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export async function POST(req: Request) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || !auth.roles.includes('admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email, first_name, last_name, phone, role } = body;
    if (!email || !first_name || !last_name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const registration_token = createToken();
    const user = await provisionUser({
      email,
      password: '',
      first_name,
      last_name,
      phone,
      status: 'pending',
      registration_token,
      provisioned_by: auth.user.id,
    });
    const roleId = getRoleIdByName(role);
    if (roleId) assignRoleToUser(user.id, roleId);
    return NextResponse.json({ ok: true, registration_token });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

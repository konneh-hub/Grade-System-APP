import { NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/services/dashboard.service';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

export async function GET(req: Request) {
  const guard = requireAuth(req);
  if ('error' in guard) return guard.error;
  return NextResponse.json(getDashboardStats());
}

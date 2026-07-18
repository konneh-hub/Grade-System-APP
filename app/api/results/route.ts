import { NextResponse } from 'next/server';
import { listResults, createResult } from '@/lib/services/result.service';
import { requireAuth, requireRoles, ensureOwnsUserOrRole } from '@/lib/middleware/authorization';

export async function GET(req: Request) {
  const guard = requireAuth(req);
  if ('error' in guard) return guard.error;
  return NextResponse.json(listResults());
}

export async function POST(req: Request) {
  const guard = requireAuth(req);
  if ('error' in guard) return guard.error;
  const body = await req.json();
  const result = createResult(body);
  return NextResponse.json(result);
}

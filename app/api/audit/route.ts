import { NextResponse } from 'next/server';
import { getRecentAuditActivity } from '@/lib/services/audit.service';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') ?? 8);
  return NextResponse.json(getRecentAuditActivity(limit));
}

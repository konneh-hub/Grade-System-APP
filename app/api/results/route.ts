import { NextResponse } from 'next/server';
import { listResults, createResult } from '@/lib/services/result.service';

export async function GET() {
  return NextResponse.json(listResults());
}

export async function POST(req: Request) {
  const body = await req.json();
  const result = createResult(body);
  return NextResponse.json(result);
}

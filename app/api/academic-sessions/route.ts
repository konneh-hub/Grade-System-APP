import { NextResponse } from 'next/server';
import { getAcademicSessions } from '@/lib/services/academicSessions';

export async function GET() {
  const sessions = getAcademicSessions();
  return NextResponse.json({ data: sessions, count: sessions.length });
}

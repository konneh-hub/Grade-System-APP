import { NextResponse } from 'next/server';
import { getAcademicSessionById } from '@/lib/services/academicSessions';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = getAcademicSessionById(params.id);
  if (!session) {
    return NextResponse.json({ error: 'Academic session not found' }, { status: 404 });
  }
  return NextResponse.json({ data: session });
}

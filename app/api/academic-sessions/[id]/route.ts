import { NextResponse, type NextRequest } from 'next/server';
import { getAcademicSessionById } from '@/lib/services/academicSessions';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const session = getAcademicSessionById(params.id);
  if (!session) {
    return NextResponse.json({ error: 'Academic session not found' }, { status: 404 });
  }
  return NextResponse.json({ data: session });
}

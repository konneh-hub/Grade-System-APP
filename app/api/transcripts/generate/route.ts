import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { getUserFromRequest } from '@/lib/middleware/auth';

export async function GET() {
  return NextResponse.json({ message: 'API route stub' });
}

export async function POST(req: Request) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const body = await req.json();
    const studentIds: number[] = Array.isArray(body?.student_ids) ? body.student_ids.map(Number) : [];
    const transcriptType = String(body?.transcript_type || 'official');

    if (studentIds.length === 0) return NextResponse.json({ error: 'no_student_ids' }, { status: 400 });

    const db = getDatabase();
    const stmt = db.prepare('INSERT INTO transcripts (student_id, transcript_type, status, generated_by, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)');
    const created: any[] = [];
    for (const sid of studentIds) {
      const res = stmt.run(sid, transcriptType, 'queued', auth.user.id) as any;
      const id = Number(res.lastInsertRowid);
      created.push({ id, student_id: sid, transcript_type: transcriptType, status: 'queued' });
    }

    return NextResponse.json({ created });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to queue transcript generation.' }, { status: 500 });
  }
}

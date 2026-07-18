import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/config/database';
import { getUserFromRequest } from '@/lib/middleware/auth';

export async function GET(req: Request) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const db = getDatabase();
  const rows = db
    .prepare(
      `SELECT t.id, t.student_id, t.transcript_type, t.status, t.request_id, t.generated_by, t.issued_at, t.file_path, t.created_at,
              s.matric_number,
              TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS student_name
       FROM transcripts t
       LEFT JOIN students s ON s.id = t.student_id
       LEFT JOIN users u ON u.id = s.user_id
       ORDER BY datetime(t.created_at) DESC`
    )
    .all() as Array<Record<string, unknown>>;

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const body = await req.json();
    const studentIds: number[] = Array.isArray(body?.student_ids) ? body.student_ids.map(Number) : [];
    const transcriptType = String(body?.transcript_type || 'official');

    if (studentIds.length === 0) {
      return NextResponse.json({ error: 'no_student_ids' }, { status: 400 });
    }

    const db = getDatabase();
    const stmt = db.prepare('INSERT INTO transcripts (student_id, transcript_type, status, generated_by, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)');
    const created: Array<Record<string, unknown>> = [];
    for (const sid of studentIds) {
      const res = stmt.run(sid, transcriptType, 'queued', auth.user.id) as { lastInsertRowid: number };
      const id = Number(res.lastInsertRowid);
      created.push({ id, student_id: sid, transcript_type: transcriptType, status: 'queued' });
    }

    return NextResponse.json({ created });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to queue transcript generation.' }, { status: 500 });
  }
}

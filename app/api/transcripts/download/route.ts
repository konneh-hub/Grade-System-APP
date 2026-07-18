import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/auth';
import { getStudentByUserId } from '@/lib/services/student.service';
import { listTranscripts } from '@/lib/services/transcript.service';

export async function GET(req: Request) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const url = new URL(req.url);
  const ids = url.searchParams.get('ids');
  const status = url.searchParams.get('status') ?? undefined;
  const studentIdParam = url.searchParams.get('student_id');
  const limitParam = Number(url.searchParams.get('limit') ?? '100');
  const offsetParam = Number(url.searchParams.get('offset') ?? '0');

  const privilegedRoles = ['admin', 'dean', 'exam_officer'];
  const canViewAll = auth.roles.some((role) => privilegedRoles.includes(role));

  const student = canViewAll ? null : getStudentByUserId(auth.user.id);
  if (!canViewAll && !student) {
    return NextResponse.json({ error: 'student_not_found' }, { status: 404 });
  }

  const idList = ids
    ? ids
        .split(',')
        .map((value: string) => Number(value.trim()))
        .filter((value: number) => Number.isFinite(value) && value > 0)
    : [];

  const transcripts = listTranscripts({
    studentId: studentIdParam ? Number(studentIdParam) : student?.id,
    status,
    limit: Number.isFinite(limitParam) ? limitParam : 100,
    offset: Number.isFinite(offsetParam) ? offsetParam : 0,
  }).filter((transcript) => (idList.length > 0 ? idList.includes(transcript.id) : true));

  return NextResponse.json({
    count: transcripts.length,
    transcripts: transcripts.map((transcript) => ({
      id: transcript.id,
      student_id: transcript.student_id,
      transcript_type: transcript.transcript_type,
      status: transcript.status,
      request_id: transcript.request_id,
      generated_by: transcript.generated_by,
      issued_at: transcript.issued_at,
      file_path: transcript.file_path,
      created_at: transcript.created_at,
      download_url: `/api/transcripts/${transcript.id}/download`,
    })),
  });
}

export async function POST(req: Request) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const privilegedRoles = ['admin', 'dean', 'exam_officer'];
  const canViewAll = auth.roles.some((role) => privilegedRoles.includes(role));
  const student = canViewAll ? null : getStudentByUserId(auth.user.id);
  if (!canViewAll && !student) {
    return NextResponse.json({ error: 'student_not_found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const ids = Array.isArray(body?.ids) ? (body.ids as any[]).map((v: any) => Number(v)).filter((value: number) => Number.isFinite(value) && value > 0) : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }

    const transcripts = listTranscripts({ studentId: student?.id }).filter((transcript) => ids.includes(transcript.id));
    return NextResponse.json({
      count: transcripts.length,
      transcripts: transcripts.map((transcript) => ({
        id: transcript.id,
        student_id: transcript.student_id,
        transcript_type: transcript.transcript_type,
        status: transcript.status,
        request_id: transcript.request_id,
        generated_by: transcript.generated_by,
        issued_at: transcript.issued_at,
        file_path: transcript.file_path,
        created_at: transcript.created_at,
        download_url: `/api/transcripts/${transcript.id}/download`,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load transcript downloads.' }, { status: 500 });
  }
}


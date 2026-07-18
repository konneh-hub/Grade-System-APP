import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/auth';
import { getStudentByUserId } from '@/lib/services/student.service';
import { getTranscriptById } from '@/lib/services/transcript.service';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const { id } = await context.params;
    const transcriptId = Number(id);
    if (!Number.isFinite(transcriptId) || transcriptId <= 0) {
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    const transcript = getTranscriptById(transcriptId);
    if (!transcript) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const privilegedRoles = ['admin', 'dean', 'exam_officer'];
    const canViewPrivileged = auth.roles.some((role) => privilegedRoles.includes(role));
    if (!canViewPrivileged) {
      const student = getStudentByUserId(auth.user.id);
      if (!student || student.id !== transcript.student_id) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({
      transcript: {
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
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load transcript details.' }, { status: 500 });
  }
}

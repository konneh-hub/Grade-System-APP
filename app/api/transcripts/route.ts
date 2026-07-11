import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/auth';
import { getStudentByUserId } from '@/lib/services/student.service';
import { getTranscriptRequestsByStudent, createTranscriptRequest } from '@/lib/services/transcript.service';
import { sendTemplatedEmail } from '@/lib/email/send';

export async function GET(req: Request) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const student = getStudentByUserId(auth.user.id);
    if (!student) return NextResponse.json({ error: 'student_not_found' }, { status: 404 });

    const requests = getTranscriptRequestsByStudent(student.id);
    return NextResponse.json(requests);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load transcript requests.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const student = getStudentByUserId(auth.user.id);
    if (!student) return NextResponse.json({ error: 'student_not_found' }, { status: 404 });

    const data = await req.json();
    const request = createTranscriptRequest({
      student_id: student.id,
      request_type: data.purpose || 'official',
      purpose: data.purpose,
      copies: data.copies,
      notes: data.notes,
    });

    try {
      sendTemplatedEmail({
        to: auth.user.email,
        type: 'transcript_notification',
        subject: 'Transcript request submitted',
        data: {
          firstName: auth.user.first_name,
          transcriptId: request?.id,
          status: request?.status,
          link: `${process.env.APP_URL ?? 'http://localhost:3000'}/student/transcripts`,
        },
        maxAttempts: 2,
      }).catch((e) => console.error('Transcript notification failed:', e));
    } catch (e) {
      console.error('Failed to trigger transcript notification:', e);
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to submit transcript request.' }, { status: 500 });
  }
}

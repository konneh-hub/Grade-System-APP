import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/auth';
import { getStudentByUserId } from '@/lib/services/student.service';
import {
  getTranscriptByRequestId,
  getTranscriptRequestsByStudent,
  createTranscriptRequest,
  TranscriptRequest,
} from '@/lib/services/transcript.service';
import { mapTranscriptRequestToResponse } from '@/lib/services/transcript-mapping.js';
// email disabled - skipping transcript emails

export async function GET(req: Request) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const student = getStudentByUserId(auth.user.id);
    if (!student) return NextResponse.json({ error: 'student_not_found' }, { status: 404 });

    const requests = getTranscriptRequestsByStudent(student.id).map((request) =>
      mapTranscriptRequestToResponse(request, getTranscriptByRequestId(request.id))
    );
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

    // email disabled: skip notification

    return NextResponse.json({
      id: request?.id,
      status: request?.status,
      requested_at: request?.requested_at,
      completed_at: request?.processed_at ?? null,
      purpose: request?.request_type ?? 'official',
      download_url: null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to submit transcript request.' }, { status: 500 });
  }
}

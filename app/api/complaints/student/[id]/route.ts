import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/auth';
import complaintService from '@/lib/services/complaint.service';
import { getStudentByUserId } from '@/lib/services/student.service';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const student = getStudentByUserId(auth.user.id);
    if (!student) return NextResponse.json({ error: 'student_not_found' }, { status: 404 });

    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    const complaint = complaintService.getComplaintById(id);
    if (!complaint) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    if (complaint.student_id !== student.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const updates = complaintService.listComplaintUpdates(id);
    return NextResponse.json({ complaint, updates });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

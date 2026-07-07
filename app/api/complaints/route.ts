import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/auth';
import { getStudentByUserId } from '@/lib/services/student.service';
import { listComplaints, createComplaint } from '@/lib/services/complaint.service';
import { sendTemplatedEmail } from '@/lib/email/send';

export async function GET(req: Request) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const student = getStudentByUserId(auth.user.id);
    if (!student) return NextResponse.json({ error: 'student_not_found' }, { status: 404 });

    return NextResponse.json(listComplaints(student.id));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load complaints.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const student = getStudentByUserId(auth.user.id);
    if (!student) return NextResponse.json({ error: 'student_not_found' }, { status: 404 });

    const data = await req.json();
    const complaint = createComplaint({ ...data, student_id: student.id, status: 'open' });

    try {
      sendTemplatedEmail({
        to: auth.user.email,
        type: 'complaint_update',
        subject: 'Complaint received',
        data: {
          firstName: auth.user.first_name,
          complaintId: complaint?.id,
          status: 'open',
          message: 'Your complaint has been submitted and is pending review.',
        },
        maxAttempts: 2,
      }).catch((e) => console.error('Complaint notification failed:', e));
    } catch (e) {
      console.error('Failed to trigger complaint notification:', e);
    }

    return NextResponse.json(complaint);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to submit complaint.' }, { status: 500 });
  }
}

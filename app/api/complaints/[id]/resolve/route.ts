import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/auth';
import complaintService from '@/lib/services/complaint.service';
import { getStudentById } from '@/lib/services/student.service';
import { createNotification } from '@/lib/services/notification.service';
// email disabled - skipping student emails

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    const existing = complaintService.getComplaintById(id);
    if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    // only staff can resolve
    const isStaff = Array.isArray(auth.roles) && auth.roles.some((r) => ['admin', 'staff', 'dean', 'exam-officer'].includes(r));
    if (!isStaff) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const resolutionMessage = body.message ?? 'Resolved by staff';

    const updated = complaintService.updateComplaint(id, { status: 'resolved' });
    complaintService.addComplaintUpdate(id, auth.user.id, resolutionMessage, 'resolved');

    // notify student
    const student = getStudentById(existing.student_id);
    if (student) {
      try {
        createNotification(student.user_id, 'Complaint resolved', `Your complaint #${id} has been resolved: ${resolutionMessage}`);
      } catch (e) {
        console.error('Failed to create notification', e);
      }
      try {
        const { getUserById } = await import('@/lib/services/user.service');
        const user = getUserById(student.user_id);
        if (user && user.email) {
          // skipped email
        }
      } catch (e) {
        console.error('Email send failed', e);
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

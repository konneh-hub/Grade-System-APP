import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/auth';
import complaintService from '@/lib/services/complaint.service';
import { getStudentById } from '@/lib/services/student.service';
import { createNotification } from '@/lib/services/notification.service';
// email disabled - skipping email sends

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    const existing = complaintService.getComplaintById(id);
    if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    // allow staff to escalate
    const isStaff = Array.isArray(auth.roles) && auth.roles.some((r) => ['admin', 'staff', 'dean', 'exam-officer'].includes(r));
    if (!isStaff) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const assignedTo = body.assigned_to ?? existing.assigned_to;
    const note = body.message ?? 'Escalated for further review';

    const updated = complaintService.updateComplaint(id, { status: 'escalated', assigned_to: assignedTo });
    complaintService.addComplaintUpdate(id, auth.user.id, note, 'escalated');

    // notify assigned user and student
    if (assignedTo) {
      try {
        createNotification(assignedTo, 'Complaint escalated', `Complaint #${id} has been escalated and assigned to you.`);
      } catch (e) {
        console.error('Failed to create notification for assignee', e);
      }
      try {
        const { getUserById } = await import('@/lib/services/user.service');
        const assignee = getUserById(assignedTo);
        // email disabled - skip
        if (assignee && assignee.email) {
          /* skipped email to assignee */
        }
      } catch (e) {
        console.error('Email to assignee failed', e);
      }
    }

    const student = getStudentById(existing.student_id);
    if (student) {
      try {
        createNotification(student.user_id, 'Complaint escalated', `Your complaint #${id} has been escalated.`);
      } catch (e) {
        console.error('Failed to create student notification', e);
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

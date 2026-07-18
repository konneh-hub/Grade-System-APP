import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/auth';
import complaintService from '@/lib/services/complaint.service';
import { getStudentByUserId } from '@/lib/services/student.service';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    const complaint = complaintService.getComplaintById(id);
    if (!complaint) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    // allow owner or staff
    const student = getStudentByUserId(auth.user.id);
    const isOwner = student && student.id === complaint.student_id;
    const isStaff = Array.isArray(auth.roles) && auth.roles.some((r) => ['admin', 'staff', 'dean', 'exam-officer'].includes(r));
    if (!isOwner && !isStaff) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    return NextResponse.json(complaint);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    const existing = complaintService.getComplaintById(id);
    if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const student = getStudentByUserId(auth.user.id);
    const isOwner = student && student.id === existing.student_id;
    const isStaff = Array.isArray(auth.roles) && auth.roles.some((r) => ['admin', 'staff', 'dean', 'exam-officer'].includes(r));
    if (!isOwner && !isStaff) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const body = await req.json();
    const updated = complaintService.updateComplaint(id, body);

    // optionally add an update message
    if (body.updateMessage) {
      const uid = auth?.user?.id ?? null;
      complaintService.addComplaintUpdate(id, uid, String(body.updateMessage), body.status ?? 'comment');
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    const existing = complaintService.getComplaintById(id);
    if (!existing) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const student = getStudentByUserId(auth.user.id);
    const isOwner = student && student.id === existing.student_id;
    const isAdmin = Array.isArray(auth.roles) && auth.roles.includes('admin');
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    complaintService.deleteComplaint(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

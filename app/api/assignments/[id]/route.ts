import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/auth';
import assignmentService from '@/lib/services/assignment.service';
import { createNotification } from '@/lib/services/notification.service';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    const assignment = assignmentService.getAssignmentById(id);
    if (!assignment) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json(assignment);
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
    const body = await req.json();
    const updated = assignmentService.updateAssignment(id, body);

    if (body.notify_students) {
      // if a lecturer wants to notify students, create a notification placeholder (real student list logic is out of scope)
      createNotification(auth.user.id, 'Assignment updated', `Assignment "${updated?.title}" was updated.`);
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
    assignmentService.deleteAssignment(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

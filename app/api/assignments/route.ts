import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/auth';
import assignmentService from '@/lib/services/assignment.service';
// email disabled: no-op import removed
import { createNotification } from '@/lib/services/notification.service';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const courseAssignmentId = url.searchParams.get('course_assignment_id');
    const list = courseAssignmentId ? assignmentService.listAssignments(Number(courseAssignmentId)) : assignmentService.listAssignments();
    return NextResponse.json(list);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const body = await req.json();
    const created = assignmentService.createAssignment(body);

    // notify lecturer's students could be many; create a lightweight notification for lecturer
    if (created) {
      try {
        if (body.notify_lecturer_id) {
          createNotification(body.notify_lecturer_id, 'New assignment created', `Assignment "${created.title}" was created.`);
        }
      } catch (e) {
        console.error('Failed to create notification for lecturer', e);
      }
    }

    return NextResponse.json(created);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

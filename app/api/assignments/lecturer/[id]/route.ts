import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/auth';
import assignmentService from '@/lib/services/assignment.service';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

    const resolvedParams = await params;
    const lecturerId = Number(resolvedParams.id);
    // allow lecturer themselves or admin
    const isSelf = auth.user.id === lecturerId;
    const isAdmin = Array.isArray(auth.roles) && auth.roles.includes('admin');
    if (!isSelf && !isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

    const list = assignmentService.listAssignmentsByLecturer(lecturerId);
    return NextResponse.json(list);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/auth';
import { getDashboardPath } from '@/lib/utils/rolePaths';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // Protect any /dashboard routes
  if (url.pathname.startsWith('/dashboard')) {
    const info = getUserFromRequest(req as Request);
    if (!info) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // If user tries to access a role-specific dashboard they don't have, redirect to their primary dashboard
    const pathParts = url.pathname.split('/').filter(Boolean);
    // e.g. ['dashboard','admin']
    if (pathParts.length >= 2) {
      const requestedRole = pathParts[1];
      const roles = info.roles || [];
      const roleMap: Record<string, string> = {
        admin: 'admin',
        dean: 'dean',
        hod: 'hod',
        lecturer: 'lecturer',
        'exam-officer': 'exam_officer',
        'exam_officer': 'exam_officer',
        student: 'student',
      };
      const requiredRole = roleMap[requestedRole];
      if (requiredRole && !roles.includes(requiredRole)) {
        return NextResponse.redirect(new URL(getDashboardPath(roles), req.url));
      }
    }
  }

  return NextResponse.next();
}

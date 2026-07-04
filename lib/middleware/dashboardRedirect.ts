import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/middleware/auth';

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  // If user is requesting the root, redirect to appropriate dashboard
  if (url.pathname === '/') {
    const info = getUserFromRequest(req as Request);
    if (!info) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    const roles = info.roles || [];
    if (roles.includes('admin')) url.pathname = '/admin';
    else if (roles.includes('dean')) url.pathname = '/dean';
    else if (roles.includes('hod')) url.pathname = '/hod';
    else if (roles.includes('lecturer')) url.pathname = '/lecturer';
    else if (roles.includes('exam_officer') || roles.includes('exam-officer')) url.pathname = '/exam-officer';
    else url.pathname = '/student';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

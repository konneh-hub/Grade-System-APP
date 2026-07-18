import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserFromRequest } from './lib/middleware/auth';

export async function middleware(request: NextRequest) {
  // Enforce authentication for API routes (except auth endpoints)
  try {
    const url = request.nextUrl.clone();
    // Allow API routes to be handled by their own route-level guards.
    if (url.pathname.startsWith('/api/')) {
      return NextResponse.next();
    }
  } catch (e) {
    // on error, continue to other middleware
  }

  // Run basic role redirect / dashboard protection for pages
  try {
    const { middleware: dashboard } = await import('./lib/middleware/dashboardRedirect');
    const { middleware: protect } = await import('./lib/middleware/protectDashboard');

    // Block non-public pages for unauthenticated users
    const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/api/auth', '/favicon.ico', '/robots.txt', '/sitemap.xml'];
    const path = request.nextUrl.pathname;
    const isPublic = publicPaths.some((p) => path === p || path.startsWith(p));
    if (!isPublic && !path.startsWith('/_next') && !path.startsWith('/public') && !path.startsWith('/api')) {
      const info = getUserFromRequest(request as unknown as Request);
      if (!info) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }
    }

    // run protect first, then dashboard redirect
    const p = protect(request);
    if (p) return p;
    return dashboard(request);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

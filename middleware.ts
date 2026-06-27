import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Run basic role redirect for root path
  try {
    const { middleware: dashboard } = await import('./lib/middleware/dashboardRedirect');
    const { middleware: protect } = await import('./lib/middleware/protectDashboard');
    // run protect first, then dashboard redirect
    const p = protect(request as any);
    if (p) return p;
    return dashboard(request as any);
  } catch (e) {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applySecurityHeaders, enforceCsrfProtection } from './lib/middleware/security-edge';

export async function middleware(request: NextRequest) {
  // Edge Runtime-safe middleware: only security headers and CSRF checks
  try {
    const url = request.nextUrl.clone();

    // For API routes: check CSRF and apply security headers
    if (url.pathname.startsWith('/api/')) {
      const csrfError = enforceCsrfProtection(request as unknown as Request);
      if (csrfError) return csrfError;

      const response = NextResponse.next();
      return applySecurityHeaders(response);
    }

    // For page routes: only apply security headers
    const response = NextResponse.next();
    return applySecurityHeaders(response);
  } catch (e) {
    // on error, pass through
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

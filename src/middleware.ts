import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
    const isApiRoute = req.nextUrl.pathname.startsWith('/api') &&
      !req.nextUrl.pathname.startsWith('/api/auth');

    if ((isAdminRoute || isApiRoute) && !token) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // Role-based access for admin routes
    if (isAdminRoute && token?.role === 'viewer') {
      const allowedPaths = ['/admin', '/admin/stats'];
      const isAllowed = allowedPaths.some(
        (p) => req.nextUrl.pathname === p || req.nextUrl.pathname.startsWith(p + '/')
      );
      if (!isAllowed) {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow public routes
        if (
          !req.nextUrl.pathname.startsWith('/admin') &&
          !req.nextUrl.pathname.startsWith('/api/')
        ) {
          return true;
        }
        // Auth API routes are always allowed
        if (req.nextUrl.pathname.startsWith('/api/auth')) {
          return true;
        }
        // Public API routes (search, public articles)
        if (req.nextUrl.pathname.startsWith('/api/search')) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl;
  
  // Check if this is a view route
  if (pathname.startsWith('/view/')) {
    // Extract the slug from the pathname
    const slug = pathname.replace('/view/', '');
    // Redirect to the main route
    return NextResponse.redirect(new URL(`/${slug}`, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/view/:path*',
}; 
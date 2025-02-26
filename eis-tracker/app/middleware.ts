import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const loggedIn = req.cookies.get('loggedIn'); // Check if user has logged in

  if (req.nextUrl.pathname === '/' && !loggedIn) {
    return NextResponse.redirect(new URL('/login', req.url)); // Redirect if not logged in
  }

  return NextResponse.next(); // Allow access otherwise
}

export const config = {
  matcher: ['/', '/home'], // Apply middleware to these routes
};

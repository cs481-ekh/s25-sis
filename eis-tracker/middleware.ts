import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("authToken")?.value;
  const path = request.nextUrl.pathname;

  // console.log("🔥 Middleware triggered at:", path);
  //
  // // Redirect to /login if unauthenticated and not already there
  // if (!token && path !== "/login") {
  //   return NextResponse.redirect(new URL("/login", request.url));
  // }
  //
  // return NextResponse.next();
}

// Match only real pages inside basePath
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|api/db|your-base-path).*)'],
};

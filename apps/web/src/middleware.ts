import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED = ["/browse", "/interests", "/chat", "/pending", "/profile"];
// Routes only accessible to admins
const ADMIN_ONLY = ["/admin"];
// Routes that should redirect away if already authenticated
const AUTH_ONLY = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthenticated = !!request.cookies.get("nammal_session")?.value;
  const isAdmin = !!request.cookies.get("nammal_admin")?.value;

  // Admin routes — must be authenticated AND admin
  if (ADMIN_ONLY.some((p) => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/browse";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Protected routes — must be authenticated
  if (PROTECTED.some((p) => pathname.startsWith(p)) && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Auth-only routes — redirect away if already logged in
  if (AUTH_ONLY.some((p) => pathname.startsWith(p)) && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = isAdmin ? "/admin" : "/browse";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/browse/:path*",
    "/interests/:path*",
    "/chat/:path*",
    "/pending/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};

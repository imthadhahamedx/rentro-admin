// middleware.ts  (project root — runs on the Edge)
// Protects all routes under /(dashboard) and redirects:
//   – Unauthenticated users           → /login
//   – CUSTOMER role (not host)        → /login  (with ?error=unauthorized)
//   – Already-logged-in on /login     → /overview

import { NextRequest, NextResponse } from "next/server";
import { TOKEN_COOKIE, ROLE_COOKIE } from "@/lib/cookies";

const PUBLIC_PATHS  = ["/login"];
const ALLOWED_ROLES = ["STAFF", "ADMIN", "SUPER_ADMIN"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const role  = request.cookies.get(ROLE_COOKIE)?.value;

  const isPublic    = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isProtected = pathname.startsWith("/overview")
    || pathname.startsWith("/vehicles")
    || pathname.startsWith("/bookings")
    || pathname.startsWith("/customers")
    || pathname.startsWith("/damage")
    || pathname.startsWith("/payments")
    || pathname.startsWith("/locations")
    || pathname.startsWith("/reports")
    || pathname.startsWith("/staff")
    || pathname.startsWith("/settings");

  // Already authenticated → skip login page
  if (isPublic && token && role && ALLOWED_ROLES.includes(role)) {
    return NextResponse.redirect(new URL("/overview", request.url));
  }

  // Protected route checks
  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (!role || !ALLOWED_ROLES.includes(role)) {
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/overview/:path*",
    "/vehicles/:path*",
    "/bookings/:path*",
    "/customers/:path*",
    "/damage/:path*",
    "/damage-reports/:path*",
    "/payments/:path*",
    "/locations/:path*",
    "/reports/:path*",
    "/staff/:path*",
    "/settings/:path*",
  ],
};

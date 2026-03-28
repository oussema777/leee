import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip i18n for admin routes and API routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    // Protect admin routes (except login)
    if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
      const token = request.cookies.get("admin-token")?.value;
      if (!token) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
    }
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|uploads|.*\\..*).*)",
    "/admin/:path*",
  ],
};

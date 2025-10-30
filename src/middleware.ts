import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/",
  "/pay",
  "/maintenance",
  "/api/stripe(.*)",
]);

// Define admin routes
const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files only
  if (pathname.startsWith("/_next/") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect();

    // Check admin routes (works for both page and API routes)
    if (isAdminRoute(request)) {
      const { sessionClaims } = await auth();
      const userRole = sessionClaims?.metadata?.role;

      if (userRole !== "admin") {
        // For API routes, return 403 instead of redirect
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        // For page routes, redirect
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Note: API routes are included so Clerk can detect auth() calls
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

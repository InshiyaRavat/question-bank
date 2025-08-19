// import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
// import { auth } from "@clerk/nextjs/server";
// import prisma from "@/lib/prisma";
// import { redirect } from "next/navigation";

// // Define public routes that don't require authentication
// const isPublicRoute = createRouteMatcher([
//   "/sign-in(.*)",
//   "/sign-up(.*)",
//   "/forgot-password",
//   "/reset-password",
//   "/", // Landing/subscription page
//   "/pay",
// ]);
// const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);

// export default clerkMiddleware(async (authHandler, request) => {
//   // Protect all routes except public ones
//   if (!isPublicRoute(request)) {
//     await authHandler.protect();
//     if (!isAdminRoute(request) && (await auth()).sessionClaims.metadata.role !== "admin") {
//       return redirect("/dashboard");
//     }
//   }
// });

// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
//     // Always run for API routes
//     "/(api|trpc)(.*)",
//   ],
// };

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/forgot-password",
  "/reset-password",
  "/", // Landing/subscription page
  "/pay",
]);
const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);

export default clerkMiddleware(async (authHandler, request) => {
  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    // Use authHandler to protect and get session info
    const { sessionClaims } = await authHandler.protect();
    
    if (!isAdminRoute(request) && sessionClaims?.metadata?.role !== "admin") {
      // Use NextResponse.redirect() with absolute URL
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Return nothing for public routes or successful auth
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
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
import { auth } from "@clerk/nextjs/server";

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
    await authHandler.protect();

    // // Check admin routes
    // if (isAdminRoute(request)) {
    //   const { sessionClaims } = await auth();
    //   const userRole = sessionClaims?.metadata?.role;

    //   if (userRole !== "admin") {
    //     // Redirect non-admin users trying to access admin routes
    //     return NextResponse.redirect(new URL("/dashboard", request.url));
    //   }
    // }
  }

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

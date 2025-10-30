import { auth } from "@clerk/nextjs/server";

export async function requireUserId() {
  const { userId } = await auth();
  if (!userId) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  return userId;
}

export async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  const userRole = sessionClaims?.metadata?.role;
  if (userRole !== "admin") {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  return userId;
}

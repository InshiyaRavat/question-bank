import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

// Helper function to check if user is admin
async function ensureAdmin() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { clerkClient } = await import('@clerk/nextjs/server');
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  
  if (user.publicMetadata?.role !== 'admin') {
    throw new Error("Forbidden");
  }
  
  return userId;
}

// GET - Get all users with their study material permissions
export async function GET() {
  try {
    await ensureAdmin();

    // Get all users from Clerk one by one (fallback approach)
    const { clerkClient } = await import('@clerk/nextjs/server');
    const clerk = await clerkClient();
    
    // First, let's try to get users from our local database if they exist
    let localUsers = [];
    try {
      localUsers = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true
        }
      });
    } catch (dbError) {
      console.log("No local users found, will fetch from Clerk");
    }

    // If we have local users, use them
    if (localUsers.length > 0) {
      const userIds = localUsers.map(user => user.id);
      
      let permissions = [];
      try {
        permissions = await prisma.userStudyMaterialPermission.findMany({
          where: {
            userId: { in: userIds }
          },
          select: {
            userId: true,
            canDownload: true,
            updatedAt: true
          }
        });
      } catch (dbError) {
        console.log("UserStudyMaterialPermission table not found, using empty permissions");
      }

      // Create a map for quick lookup
      const permissionMap = new Map();
      permissions.forEach(permission => {
        permissionMap.set(permission.userId, {
          canDownload: permission.canDownload,
          lastUpdated: permission.updatedAt
        });
      });

      // Format the response
      const formattedUsers = localUsers.map(user => {
        const permission = permissionMap.get(user.id);
        return {
          id: user.id,
          name: user.name || 'Unknown',
          email: user.email || 'No email',
          canDownload: permission?.canDownload || false,
          lastUpdated: permission?.lastUpdated || null
        };
      });

      return NextResponse.json({ users: formattedUsers });
    }

    // Fallback: Try to get users from Clerk with a simpler approach
    try {
      console.log("Trying to fetch users from Clerk...");
      const clerkUsers = await clerk.users.getUserList();
      console.log(`Successfully fetched ${clerkUsers.data.length} users from Clerk`);
      
      // Get study material permissions for all users
      const userIds = clerkUsers.data.map(user => user.id);
      
      let permissions = [];
      try {
        permissions = await prisma.userStudyMaterialPermission.findMany({
          where: {
            userId: { in: userIds }
          },
          select: {
            userId: true,
            canDownload: true,
            updatedAt: true
          }
        });
      } catch (dbError) {
        console.log("UserStudyMaterialPermission table not found, using empty permissions");
      }

      // Create a map for quick lookup
      const permissionMap = new Map();
      permissions.forEach(permission => {
        permissionMap.set(permission.userId, {
          canDownload: permission.canDownload,
          lastUpdated: permission.updatedAt
        });
      });

      // Format the response
      const formattedUsers = clerkUsers.data.map(user => {
        const permission = permissionMap.get(user.id);
        return {
          id: user.id,
          name: user.fullName || user.firstName + (user.lastName ? ` ${user.lastName}` : '') || user.username || 'Unknown',
          email: user.emailAddresses?.[0]?.emailAddress || 'No email',
          canDownload: permission?.canDownload || false,
          lastUpdated: permission?.lastUpdated || null
        };
      });

      return NextResponse.json({ users: formattedUsers });

    } catch (clerkError) {
      console.error("Clerk API error:", clerkError);
      return NextResponse.json({ 
        error: "Failed to fetch users. Please check your Clerk configuration.",
        details: clerkError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Users fetch error:", error);
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

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

    // Get all users from Clerk
    const { clerkClient } = await import('@clerk/nextjs/server');
    const clerk = await clerkClient();
    
    let clerkUsers;
    try {
      console.log("Fetching users from Clerk...");
      clerkUsers = await clerk.users.getUserList({
        limit: 100
        // Removed orderBy as it might not be supported
      });
      console.log(`Successfully fetched ${clerkUsers.data.length} users from Clerk`);
    } catch (clerkError) {
      console.error("Clerk API error:", clerkError);
      console.error("Clerk error details:", clerkError.errors);
      return NextResponse.json({ 
        error: "Failed to fetch users from Clerk", 
        details: clerkError.message,
        clerkErrors: clerkError.errors
      }, { status: 500 });
    }

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
      // Table might not exist yet, continue with empty permissions
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

  } catch (error) {
    console.error("Study material permissions error:", error);
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
}

// POST - Update study material permission for a user
export async function POST(req) {
  try {
    await ensureAdmin();

    const { userId, canDownload } = await req.json();

    if (!userId || typeof canDownload !== 'boolean') {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    // Upsert the permission
    let permission;
    try {
      permission = await prisma.userStudyMaterialPermission.upsert({
        where: { userId },
        update: { canDownload },
        create: { userId, canDownload }
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: "Database table not found. Please run: npx prisma generate && npx prisma db push" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      permission: {
        userId: permission.userId,
        canDownload: permission.canDownload,
        updatedAt: permission.updatedAt
      }
    });

  } catch (error) {
    console.error("Study material permission update error:", error);
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update permission" }, { status: 500 });
  }
}

// DELETE - Remove study material permission (revert to default: false)
export async function DELETE(req) {
  try {
    await ensureAdmin();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    try {
      await prisma.userStudyMaterialPermission.delete({
        where: { userId }
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: "Database table not found. Please run: npx prisma generate && npx prisma db push" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Study material permission delete error:", error);
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete permission" }, { status: 500 });
  }
}

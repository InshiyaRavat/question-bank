import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth, clerkClient } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

async function ensureAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const clerk = await clerkClient();
  const u = await clerk.users.getUser(userId);
  const role = u && u.publicMetadata ? u.publicMetadata.role : undefined;
  return role === 'admin';
}

export async function GET(req) {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    // Get all users with retake limits
    const clerk = await clerkClient();
    const clerkUsers = await clerk.users.getUserList({
      limit: 1000,
      orderBy: "created_at"
    });

    // Get retake limits
    const retakeLimits = await prisma.userRetakeLimit.findMany({
      orderBy: { updatedAt: 'desc' }
    });

    // Create a map of userId to retake limit
    const limitMap = new Map();
    retakeLimits.forEach(limit => {
      limitMap.set(limit.userId, limit);
    });

    // Process users with their retake limits
    let users = clerkUsers.data.map(user => {
      const retakeLimit = limitMap.get(user.id);
      const userName = user.fullName || 
                     user.firstName + (user.lastName ? ` ${user.lastName}` : '') ||
                     user.username || 
                     user.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
                     "Unknown User";

      return {
        id: user.id,
        name: userName,
        email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || "No email",
        maxRetakes: retakeLimit?.maxRetakes ?? -1,
        isUnlimited: (retakeLimit?.maxRetakes ?? -1) === -1,
        updatedAt: retakeLimit?.updatedAt || user.createdAt,
        hasCustomLimit: !!retakeLimit
      };
    });

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const total = users.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get retake limits error:", error);
    return NextResponse.json({ error: "Failed to get retake limits" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { userId, maxRetakes } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (maxRetakes === undefined || maxRetakes < -1) {
      return NextResponse.json({ error: "Invalid max retakes value" }, { status: 400 });
    }

    // Verify user exists
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Upsert retake limit
    const retakeLimit = await prisma.userRetakeLimit.upsert({
      where: { userId },
      update: { 
        maxRetakes,
        updatedAt: new Date()
      },
      create: {
        userId,
        maxRetakes
      }
    });

    return NextResponse.json({
      success: true,
      retakeLimit: {
        userId: retakeLimit.userId,
        maxRetakes: retakeLimit.maxRetakes,
        isUnlimited: retakeLimit.maxRetakes === -1,
        updatedAt: retakeLimit.updatedAt
      }
    });

  } catch (error) {
    console.error("Set retake limit error:", error);
    return NextResponse.json({ error: "Failed to set retake limit" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Delete retake limit (user will have unlimited retakes)
    await prisma.userRetakeLimit.deleteMany({
      where: { userId }
    });

    return NextResponse.json({
      success: true,
      message: "Retake limit removed. User now has unlimited retakes."
    });

  } catch (error) {
    console.error("Delete retake limit error:", error);
    return NextResponse.json({ error: "Failed to delete retake limit" }, { status: 500 });
  }
}

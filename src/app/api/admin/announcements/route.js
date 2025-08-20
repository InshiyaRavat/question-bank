import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  validateAnnouncementData,
  validateAnnouncementQuery,
  sanitizeAnnouncementData,
  formatValidationError,
  AnnouncementValidationError,
} from "@/lib/announcementValidation";
import { logAdminActivity, ADMIN_ACTIONS, RESOURCE_TYPES, extractClientInfo } from "@/lib/adminLogger";

// Helper function to get admin info from auth
async function getAdminInfo() {
  const { userId, sessionClaims } = await auth();
  const adminName =
    sessionClaims?.firstName && sessionClaims?.lastName
      ? `${sessionClaims.firstName} ${sessionClaims.lastName}`.trim()
      : sessionClaims?.username || "Unknown Admin";

  return { adminId: userId, adminName };
}

// GET /api/admin/announcements - Get all announcements for admin
export async function GET(req) {
  try {
    // const { sessionClaims } = await auth();

    // // Check if user is admin
    // if (sessionClaims?.metadata?.role !== "admin") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    // }

    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const { page, limit, ...filters } = validateAnnouncementQuery(queryParams);

    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) where[key] = value;
    });

    const [announcements, totalCount] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        include: {
          readBy: {
            select: {
              userId: true,
              readAt: true,
            },
          },
        },
      }),
      prisma.announcement.count({ where }),
    ]);

    return NextResponse.json({
      announcements,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/announcements - Create new announcement
export async function POST(req) {
  try {
    const { userId } = await auth();

    // Check if user is admin
    // if (sessionClaims?.metadata?.role !== "admin") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    // }

    const body = await req.json();

    // Set defaults
    const dataWithDefaults = {
      type: "info",
      priority: "medium",
      isActive: true,
      targetRole: "all",
      ...body,
    };

    // Validate and sanitize data
    let validatedData;
    try {
      validatedData = validateAnnouncementData(dataWithDefaults);
      validatedData = sanitizeAnnouncementData(validatedData);
    } catch (error) {
      if (error instanceof AnnouncementValidationError) {
        return NextResponse.json(formatValidationError(error), { status: 400 });
      }
      throw error;
    }

    const announcement = await prisma.announcement.create({
      data: {
        ...validatedData,
        createdBy: userId,
      },
    });

    // Log the activity
    const { adminId, adminName } = await getAdminInfo();
    const { ipAddress, userAgent } = extractClientInfo(req);

    await logAdminActivity({
      adminId,
      adminName,
      action: ADMIN_ACTIONS.ANNOUNCEMENT_CREATED,
      resource: RESOURCE_TYPES.ANNOUNCEMENT,
      resourceId: announcement.id.toString(),
      details: {
        title: announcement.title,
        type: announcement.type,
        priority: announcement.priority,
        targetRole: announcement.targetRole,
        isActive: announcement.isActive,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

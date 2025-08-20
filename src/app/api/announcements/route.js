import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// GET /api/announcements - Get active announcements for current user
export async function GET(req) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeRead = searchParams.get("includeRead") === "true";
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit")) || 50;

    // Determine user role
    // const userRole = sessionClaims?.metadata?.role || "student";

    // Build filter conditions
    const where = {
      isActive: true,
      OR: [{ targetRole: "all" }],
      // Only show announcements that are currently active based on date range
      AND: [
        {
          OR: [{ startDate: null }, { startDate: { lte: new Date() } }],
        },
        {
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
      ],
    };

    if (type) {
      where.type = type;
    }

    // Get announcements
    const announcements = await prisma.announcement.findMany({
      where,
      take: limit,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        readBy: {
          where: { userId },
          select: {
            readAt: true,
          },
        },
      },
    });

    // Filter out read announcements if not requested
    let filteredAnnouncements = announcements;
    if (!includeRead) {
      filteredAnnouncements = announcements.filter((announcement) => announcement.readBy.length === 0);
    }

    // Transform the response to include read status
    const transformedAnnouncements = filteredAnnouncements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      targetRole: announcement.targetRole,
      startDate: announcement.startDate,
      endDate: announcement.endDate,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
      isRead: announcement.readBy.length > 0,
      readAt: announcement.readBy[0]?.readAt || null,
    }));

    return NextResponse.json({
      announcements: transformedAnnouncements,
      unreadCount: announcements.filter((a) => a.readBy.length === 0).length,
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  validateAnnouncementData,
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

// GET /api/admin/announcements/[id] - Get specific announcement
export async function GET(req, { params }) {
  try {
    const { sessionClaims } = await auth();

    // Check if user is admin
    if (sessionClaims?.metadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const announcementId = parseInt(id);

    if (isNaN(announcementId)) {
      return NextResponse.json({ error: "Invalid announcement ID" }, { status: 400 });
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        readBy: {
          select: {
            userId: true,
            readAt: true,
          },
        },
      },
    });

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/announcements/[id] - Update announcement
export async function PUT(req, { params }) {
  try {
    const { sessionClaims } = await auth();

    // Check if user is admin
    if (sessionClaims?.metadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const announcementId = parseInt(id);

    if (isNaN(announcementId)) {
      return NextResponse.json({ error: "Invalid announcement ID" }, { status: 400 });
    }

    const body = await req.json();

    // Check if announcement exists
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!existingAnnouncement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    // Validate and sanitize data (for updates, partial data is allowed)
    let validatedData;
    try {
      validatedData = validateAnnouncementData(body, true); // isUpdate = true
      validatedData = sanitizeAnnouncementData(validatedData);
    } catch (error) {
      if (error instanceof AnnouncementValidationError) {
        return NextResponse.json(formatValidationError(error), { status: 400 });
      }
      throw error;
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id: announcementId },
      data: validatedData,
      include: {
        readBy: {
          select: {
            userId: true,
            readAt: true,
          },
        },
      },
    });

    // Log the activity
    const { adminId, adminName } = await getAdminInfo();
    const { ipAddress, userAgent } = extractClientInfo(req);

    await logAdminActivity({
      adminId,
      adminName,
      action: ADMIN_ACTIONS.ANNOUNCEMENT_UPDATED,
      resource: RESOURCE_TYPES.ANNOUNCEMENT,
      resourceId: announcementId.toString(),
      details: {
        updatedFields: Object.keys(validatedData),
        title: updatedAnnouncement.title,
        previousData: {
          title: existingAnnouncement.title,
          type: existingAnnouncement.type,
          priority: existingAnnouncement.priority,
          isActive: existingAnnouncement.isActive,
        },
        newData: {
          title: updatedAnnouncement.title,
          type: updatedAnnouncement.type,
          priority: updatedAnnouncement.priority,
          isActive: updatedAnnouncement.isActive,
        },
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(updatedAnnouncement);
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/announcements/[id] - Delete announcement
export async function DELETE(req, { params }) {
  try {
    const { sessionClaims } = await auth();

    // Check if user is admin
    if (sessionClaims?.metadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const announcementId = parseInt(id);

    if (isNaN(announcementId)) {
      return NextResponse.json({ error: "Invalid announcement ID" }, { status: 400 });
    }

    // Check if announcement exists
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!existingAnnouncement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    // Delete the announcement (this will cascade delete related reads)
    await prisma.announcement.delete({
      where: { id: announcementId },
    });

    // Log the activity
    const { adminId, adminName } = await getAdminInfo();
    const { ipAddress, userAgent } = extractClientInfo(req);

    await logAdminActivity({
      adminId,
      adminName,
      action: ADMIN_ACTIONS.ANNOUNCEMENT_DELETED,
      resource: RESOURCE_TYPES.ANNOUNCEMENT,
      resourceId: announcementId.toString(),
      details: {
        deletedTitle: existingAnnouncement.title,
        deletedType: existingAnnouncement.type,
        deletedPriority: existingAnnouncement.priority,
        wasActive: existingAnnouncement.isActive,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ message: "Announcement deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

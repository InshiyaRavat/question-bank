import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// POST /api/announcements/[id]/read - Mark announcement as read
export async function POST(req, { params }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const announcementId = parseInt(id);

    if (isNaN(announcementId)) {
      return NextResponse.json({ error: "Invalid announcement ID" }, { status: 400 });
    }

    // Check if announcement exists
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    // Check if already read
    const existingRead = await prisma.announcementRead.findUnique({
      where: {
        userId_announcementId: {
          userId,
          announcementId,
        },
      },
    });

    if (existingRead) {
      return NextResponse.json({
        message: "Announcement already marked as read",
        readAt: existingRead.readAt,
      });
    }

    // Mark as read
    const announcementRead = await prisma.announcementRead.create({
      data: {
        userId,
        announcementId,
      },
    });

    return NextResponse.json({
      message: "Announcement marked as read",
      readAt: announcementRead.readAt,
    });
  } catch (error) {
    console.error("Error marking announcement as read:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/announcements/[id]/read - Mark announcement as unread
export async function DELETE(req, { params }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const announcementId = parseInt(id);

    if (isNaN(announcementId)) {
      return NextResponse.json({ error: "Invalid announcement ID" }, { status: 400 });
    }

    // Delete the read record
    const deleted = await prisma.announcementRead.deleteMany({
      where: {
        userId,
        announcementId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ message: "Announcement was not marked as read" }, { status: 200 });
    }

    return NextResponse.json({
      message: "Announcement marked as unread",
    });
  } catch (error) {
    console.error("Error marking announcement as unread:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { logAdminActivity } from "@/lib/adminLogger";

const prisma = new PrismaClient();

// DELETE /api/admin/trash/permanent-delete - Permanently delete soft-deleted items
export async function DELETE(req) {
  try {
    // Check authentication
    const { userId } = await auth();
    // if (!userId) {
    //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await req.json();
    const { type, ids } = body; // type: 'question', 'topic', 'subject', ids: array of IDs

    if (!type || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        {
          error: "Type and IDs array are required",
        },
        { status: 400 }
      );
    }

    const numericIds = ids.map((id) => parseInt(id)).filter((id) => !isNaN(id));

    if (numericIds.length === 0) {
      return NextResponse.json(
        {
          error: "No valid IDs provided",
        },
        { status: 400 }
      );
    }

    let deletedItems = [];
    let deletedCount = 0;

    if (type === "question") {
      // Get questions to delete (only soft-deleted ones)
      const questionsToDelete = await prisma.question.findMany({
        where: {
          id: { in: numericIds },
          deletedAt: { not: null },
        },
        select: { id: true, questionText: true, topicId: true },
      });

      if (questionsToDelete.length === 0) {
        return NextResponse.json(
          {
            error: "No deleted questions found with the provided IDs",
          },
          { status: 404 }
        );
      }

      // Permanently delete questions (cascade will handle comments, replies, etc.)
      await prisma.question.deleteMany({
        where: {
          id: { in: questionsToDelete.map((q) => q.id) },
          deletedAt: { not: null },
        },
      });

      deletedItems = questionsToDelete;
      deletedCount = questionsToDelete.length;
    } else if (type === "topic") {
      // Get topics to delete (only soft-deleted ones)
      const topicsToDelete = await prisma.topic.findMany({
        where: {
          id: { in: numericIds },
          deletedAt: { not: null },
        },
        include: {
          questions: {
            where: { deletedAt: { not: null } },
            select: { id: true },
          },
        },
      });

      if (topicsToDelete.length === 0) {
        return NextResponse.json(
          {
            error: "No deleted topics found with the provided IDs",
          },
          { status: 404 }
        );
      }

      // Permanently delete topics (cascade will handle questions, comments, etc.)
      await prisma.topic.deleteMany({
        where: {
          id: { in: topicsToDelete.map((t) => t.id) },
          deletedAt: { not: null },
        },
      });

      deletedItems = topicsToDelete;
      deletedCount = topicsToDelete.length;
    } else if (type === "subject") {
      // Get subjects to delete (only soft-deleted ones)
      const subjectsToDelete = await prisma.subject.findMany({
        where: {
          id: { in: numericIds },
          deletedAt: { not: null },
        },
        include: {
          topics: {
            where: { deletedAt: { not: null } },
            select: { id: true, name: true },
          },
        },
      });

      if (subjectsToDelete.length === 0) {
        return NextResponse.json(
          {
            error: "No deleted subjects found with the provided IDs",
          },
          { status: 404 }
        );
      }

      // Permanently delete subjects (cascade will handle topics, questions, etc.)
      await prisma.subject.deleteMany({
        where: {
          id: { in: subjectsToDelete.map((s) => s.id) },
          deletedAt: { not: null },
        },
      });

      deletedItems = subjectsToDelete;
      deletedCount = subjectsToDelete.length;
    } else {
      return NextResponse.json(
        {
          error: "Invalid type. Must be 'question', 'topic', or 'subject'",
        },
        { status: 400 }
      );
    }

    // Log admin activity
    try {
      await logAdminActivity({
        adminId: userId || "admin",
        adminName: "Admin",
        action: `${type}_permanently_deleted`,
        resource: type,
        resourceId: numericIds.join(","),
        details: {
          deletedCount,
          deletedItems: deletedItems.map((item) => ({
            id: item.id,
            name: item.name || item.questionText?.substring(0, 50) + "...",
          })),
        },
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
      });
    } catch (logError) {
      console.error("Failed to log admin activity:", logError);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully permanently deleted ${deletedCount} ${type}${deletedCount !== 1 ? "s" : ""}`,
      deletedCount,
      deletedItems,
    });
  } catch (error) {
    console.error("Error permanently deleting items:", error);
    return NextResponse.json({ error: "Failed to permanently delete items" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

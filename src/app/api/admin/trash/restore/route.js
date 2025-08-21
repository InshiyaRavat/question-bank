import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { logAdminActivity } from "@/lib/adminLogger";

const prisma = new PrismaClient();

// POST /api/admin/trash/restore - Restore soft-deleted items
export async function POST(req) {
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

    let restoredItems = [];
    let restoredCount = 0;

    if (type === "question") {
      // Restore questions and update topic counts
      const questionsToRestore = await prisma.question.findMany({
        where: {
          id: { in: numericIds },
          deletedAt: { not: null },
        },
        select: { id: true, topicId: true, questionText: true },
      });

      if (questionsToRestore.length === 0) {
        return NextResponse.json(
          {
            error: "No deleted questions found with the provided IDs",
          },
          { status: 404 }
        );
      }

      // Count questions per topic for updating noOfQuestions
      const topicCounts = {};
      questionsToRestore.forEach((question) => {
        topicCounts[question.topicId] = (topicCounts[question.topicId] || 0) + 1;
      });

      await prisma.$transaction(async (tx) => {
        // Restore questions
        await tx.question.updateMany({
          where: { id: { in: numericIds }, deletedAt: { not: null } },
          data: { deletedAt: null, deletedBy: null },
        });

        // Update topic question counts
        const topicUpdates = Object.entries(topicCounts).map(([topicId, count]) =>
          tx.topic.update({
            where: { id: parseInt(topicId) },
            data: { noOfQuestions: { increment: count } },
          })
        );

        await Promise.all(topicUpdates);
      });

      restoredItems = questionsToRestore;
      restoredCount = questionsToRestore.length;
    } else if (type === "topic") {
      // Restore topics and their questions
      const topicsToRestore = await prisma.topic.findMany({
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

      if (topicsToRestore.length === 0) {
        return NextResponse.json(
          {
            error: "No deleted topics found with the provided IDs",
          },
          { status: 404 }
        );
      }

      await prisma.$transaction(async (tx) => {
        // Restore topics
        await tx.topic.updateMany({
          where: { id: { in: numericIds }, deletedAt: { not: null } },
          data: { deletedAt: null, deletedBy: null },
        });

        // Restore all questions in these topics
        for (const topic of topicsToRestore) {
          if (topic.questions.length > 0) {
            await tx.question.updateMany({
              where: {
                id: { in: topic.questions.map((q) => q.id) },
                deletedAt: { not: null },
              },
              data: { deletedAt: null, deletedBy: null },
            });
          }
        }
      });

      restoredItems = topicsToRestore;
      restoredCount = topicsToRestore.length;
    } else if (type === "subject") {
      // Restore subjects, their topics, and questions
      const subjectsToRestore = await prisma.subject.findMany({
        where: {
          id: { in: numericIds },
          deletedAt: { not: null },
        },
        include: {
          topics: {
            where: { deletedAt: { not: null } },
            include: {
              questions: {
                where: { deletedAt: { not: null } },
                select: { id: true },
              },
            },
          },
        },
      });

      if (subjectsToRestore.length === 0) {
        return NextResponse.json(
          {
            error: "No deleted subjects found with the provided IDs",
          },
          { status: 404 }
        );
      }

      await prisma.$transaction(async (tx) => {
        // Restore subjects
        await tx.subject.updateMany({
          where: { id: { in: numericIds }, deletedAt: { not: null } },
          data: { deletedAt: null, deletedBy: null },
        });

        // Restore all topics and questions in these subjects
        for (const subject of subjectsToRestore) {
          if (subject.topics.length > 0) {
            const topicIds = subject.topics.map((t) => t.id);

            // Restore topics
            await tx.topic.updateMany({
              where: {
                id: { in: topicIds },
                deletedAt: { not: null },
              },
              data: { deletedAt: null, deletedBy: null },
            });

            // Restore questions
            const questionIds = subject.topics.flatMap((t) => t.questions.map((q) => q.id));
            if (questionIds.length > 0) {
              await tx.question.updateMany({
                where: {
                  id: { in: questionIds },
                  deletedAt: { not: null },
                },
                data: { deletedAt: null, deletedBy: null },
              });
            }
          }
        }
      });

      restoredItems = subjectsToRestore;
      restoredCount = subjectsToRestore.length;
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
        action: `${type}_restored`,
        resource: type,
        resourceId: numericIds.join(","),
        details: {
          restoredCount,
          restoredItems: restoredItems.map((item) => ({
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
      message: `Successfully restored ${restoredCount} ${type}${restoredCount !== 1 ? "s" : ""}`,
      restoredCount,
      restoredItems,
    });
  } catch (error) {
    console.error("Error restoring items:", error);
    return NextResponse.json({ error: "Failed to restore items" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

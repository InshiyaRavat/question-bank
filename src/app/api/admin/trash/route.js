import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/admin/trash - Get all soft-deleted items
export async function GET(req) {
  try {
    // Check authentication
    const { userId } = await auth();
    // if (!userId) {
    //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // 'questions', 'topics', 'subjects', or 'all'
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 50;
    const offset = (page - 1) * limit;

    const trashData = {};

    if (!type || type === "all" || type === "questions") {
      // Get soft-deleted questions
      const questions = await prisma.question.findMany({
        where: {
          deletedAt: { not: null },
        },
        include: {
          topic: {
            select: {
              id: true,
              name: true,
              subject: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { deletedAt: "desc" },
        skip: type === "questions" ? offset : 0,
        take: type === "questions" ? limit : undefined,
      });

      trashData.questions = questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        difficulty: q.difficulty,
        tags: q.tags,
        deletedAt: q.deletedAt,
        deletedBy: q.deletedBy,
        topic: q.topic,
        type: "question",
      }));
    }

    if (!type || type === "all" || type === "topics") {
      // Get soft-deleted topics
      const topics = await prisma.topic.findMany({
        where: {
          deletedAt: { not: null },
        },
        include: {
          subject: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              questions: {
                where: { deletedAt: { not: null } },
              },
            },
          },
        },
        orderBy: { deletedAt: "desc" },
        skip: type === "topics" ? offset : 0,
        take: type === "topics" ? limit : undefined,
      });

      trashData.topics = topics.map((t) => ({
        id: t.id,
        name: t.name,
        noOfQuestions: t.noOfQuestions,
        deletedAt: t.deletedAt,
        deletedBy: t.deletedBy,
        subject: t.subject,
        questionsInTrash: t._count.questions,
        type: "topic",
      }));
    }

    if (!type || type === "all" || type === "subjects") {
      // Get soft-deleted subjects
      const subjects = await prisma.subject.findMany({
        where: {
          deletedAt: { not: null },
        },
        include: {
          _count: {
            select: {
              topics: {
                where: { deletedAt: { not: null } },
              },
            },
          },
        },
        orderBy: { deletedAt: "desc" },
        skip: type === "subjects" ? offset : 0,
        take: type === "subjects" ? limit : undefined,
      });

      trashData.subjects = subjects.map((s) => ({
        id: s.id,
        name: s.name,
        deletedAt: s.deletedAt,
        deletedBy: s.deletedBy,
        topicsInTrash: s._count.topics,
        type: "subject",
      }));
    }

    // Get counts for pagination
    const counts = {};
    if (!type || type === "all") {
      counts.questions = await prisma.question.count({ where: { deletedAt: { not: null } } });
      counts.topics = await prisma.topic.count({ where: { deletedAt: { not: null } } });
      counts.subjects = await prisma.subject.count({ where: { deletedAt: { not: null } } });
      counts.total = counts.questions + counts.topics + counts.subjects;
    } else {
      const modelMap = {
        questions: "question",
        topics: "topic",
        subjects: "subject",
      };
      counts[type] = await prisma[modelMap[type]].count({
        where: { deletedAt: { not: null } },
      });
    }

    return NextResponse.json({
      success: true,
      data: trashData,
      pagination: {
        page,
        limit,
        counts,
      },
    });
  } catch (error) {
    console.error("Error fetching trash data:", error);
    return NextResponse.json({ error: "Failed to fetch trash data" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

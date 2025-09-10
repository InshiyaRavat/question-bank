import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// GET handler to fetch questions
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const topicIds = searchParams.getAll("topicId");
    const count = searchParams.get("count");
    const questionCount = parseInt(searchParams.get("questionCount")) || 50;

    // If only count is requested, return total count
    if (count === "true") {
      const whereClause = {
        deletedAt: null,
        topic: {
          deletedAt: null,
          subject: {
            deletedAt: null,
          },
        },
      };

      if (topicIds.length > 0) {
        whereClause.topicId = { in: topicIds.map(id => parseInt(id)) };
      }

      const totalCount = await prisma.question.count({
        where: whereClause,
      });

      return new Response(JSON.stringify({ total: totalCount }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const whereClause = {
      deletedAt: null,
      topic: {
        deletedAt: null,
        subject: {
          deletedAt: null,
        },
      },
    };

    if (topicIds.length > 0) {
      whereClause.topicId = { in: topicIds.map(id => parseInt(id)) };
    }

    const questions = await prisma.question.findMany({
      where: whereClause,
      include: {
        topic: {
          include: {
            subject: true,
          },
        },
      },
      take: questionCount,
    });

    // Shuffle questions for variety
    const shuffledQuestions = questions.sort(() => 0.5 - Math.random());

    return new Response(JSON.stringify(shuffledQuestions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET Questions Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch questions" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// POST handler to create a new question
export async function POST(request) {
  try {
    const body = await request.json();
    const { questionText, options, correctOptionIdx, topicId, difficulty, tags, explanation } = body;

    // Validate required fields
    if (!questionText || !options || correctOptionIdx === undefined || !topicId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const newQuestion = await prisma.question.create({
      data: {
        questionText,
        options,
        correctOptionIdx,
        topicId: parseInt(topicId),
        difficulty: difficulty || "medium",
        tags: Array.isArray(tags) ? tags : tags ? [tags] : [],
        explanation: explanation || "",
      },
    });

    // Update topic question count
    await prisma.topic.update({
      where: { id: parseInt(topicId) },
      data: {
        noOfQuestions: {
          increment: 1,
        },
      },
    });

    return new Response(JSON.stringify(newQuestion), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("POST Question Error:", error);
    return new Response(JSON.stringify({ error: "Failed to create question" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

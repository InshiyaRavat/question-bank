import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

// GET handler to fetch detailed information about a specific flagged question
export async function GET(request, { params }) {
  try {
    const { userId, sessionClaims } = await auth();

    // Check if user is admin
    if (!userId || sessionClaims?.metadata?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized - Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const questionId = parseInt(params.id);

    if (!questionId) {
      return new Response(JSON.stringify({ error: "Invalid question ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get all flags for this question
    const flags = await prisma.questionFlag.findMany({
      where: {
        questionId: questionId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get question details
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        topic: {
          include: {
            subject: true,
          },
        },
        comments: {
          include: {
            replies: true,
          },
        },
        solvedQuestions: {
          take: 10,
          orderBy: {
            solvedAt: "desc",
          },
        },
      },
    });

    if (!question) {
      return new Response(JSON.stringify({ error: "Question not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get flag statistics for this question
    const flagStats = await prisma.questionFlag.groupBy({
      by: ["status", "reason"],
      where: {
        questionId: questionId,
      },
      _count: {
        id: true,
      },
    });

    return new Response(
      JSON.stringify({
        question,
        flags,
        statistics: flagStats,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("GET Flagged Question Details Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch question details" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

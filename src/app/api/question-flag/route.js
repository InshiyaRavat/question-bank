import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

// GET handler to fetch user's flags for a question
export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return new Response(JSON.stringify({ error: "Question ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const flag = await prisma.questionFlag.findUnique({
      where: {
        questionId_userId: {
          questionId: parseInt(questionId),
          userId: userId,
        },
      },
    });

    return new Response(JSON.stringify({ flag }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET Question Flag Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch flag status" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// POST handler to create a new question flag
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { questionId, reason, details } = body;

    // Validate required fields
    if (!questionId || !reason) {
      return new Response(JSON.stringify({ error: "Question ID and reason are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if question exists and is not deleted
    const question = await prisma.question.findFirst({
      where: {
        id: parseInt(questionId),
        deletedAt: null,
      },
    });

    if (!question) {
      return new Response(JSON.stringify({ error: "Question not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user info (we'll need to get username from Clerk since we don't store users in our DB)
    // For now, we'll use userId as username - you might want to fetch from Clerk
    const username = userId; // This should be replaced with actual username from Clerk

    // Check if user has already flagged this question
    const existingFlag = await prisma.questionFlag.findUnique({
      where: {
        questionId_userId: {
          questionId: parseInt(questionId),
          userId: userId,
        },
      },
    });

    if (existingFlag) {
      return new Response(JSON.stringify({ error: "You have already flagged this question" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create the flag
    const flag = await prisma.questionFlag.create({
      data: {
        questionId: parseInt(questionId),
        userId: userId,
        username: username,
        reason: reason,
        details: details || null,
        status: "pending",
      },
    });

    return new Response(JSON.stringify({ flag, message: "Question flagged successfully" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("POST Question Flag Error:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return new Response(JSON.stringify({ error: "You have already flagged this question" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Failed to flag question" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// DELETE handler to remove a flag (unflag)
export async function DELETE(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return new Response(JSON.stringify({ error: "Question ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete the flag if it exists and belongs to the user
    const deletedFlag = await prisma.questionFlag.deleteMany({
      where: {
        questionId: parseInt(questionId),
        userId: userId,
      },
    });

    if (deletedFlag.count === 0) {
      return new Response(JSON.stringify({ error: "Flag not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: "Flag removed successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("DELETE Question Flag Error:", error);
    return new Response(JSON.stringify({ error: "Failed to remove flag" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

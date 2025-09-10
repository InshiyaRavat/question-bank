import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

// GET handler to fetch user's test sessions
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
    const status = searchParams.get("status") || "all";
    const limit = parseInt(searchParams.get("limit")) || 20;

    const where = { userId };
    if (status !== "all") {
      where.status = status;
    }

    const sessions = await prisma.testSession.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: limit,
    });

    return new Response(JSON.stringify({ sessions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GET Test Sessions Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch test sessions" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// POST handler to create a new test session
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
    const { testType, questionIds, totalQuestions } = body;

    // Validate required fields
    if (!testType || !questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return new Response(JSON.stringify({ error: "Missing required fields or invalid question IDs" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate unique session ID
    const sessionId = uuidv4();

    // Create the test session
    const session = await prisma.testSession.create({
      data: {
        userId,
        sessionId,
        testType,
        questionIds: questionIds,
        totalQuestions: totalQuestions || questionIds.length,
        status: "active",
      },
    });

    return new Response(JSON.stringify({ session, message: "Test session created successfully" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("POST Test Session Error:", error);
    return new Response(JSON.stringify({ error: "Failed to create test session" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// PUT handler to update test session (complete, update score, etc.)
export async function PUT(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { sessionId, score, correctCount, incorrectCount, status, topicStats } = body;
    
    console.log("Test session update - topicStats received:", topicStats);

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Session ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Find the session and verify ownership
    const existingSession = await prisma.testSession.findUnique({
      where: { sessionId },
    });

    if (!existingSession || existingSession.userId !== userId) {
      return new Response(JSON.stringify({ error: "Session not found or unauthorized" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update the session
    const updateData = {};
    if (score !== undefined) updateData.score = score;
    if (correctCount !== undefined) updateData.correctCount = correctCount;
    if (incorrectCount !== undefined) updateData.incorrectCount = incorrectCount;
    if (topicStats !== undefined) updateData.topicStats = topicStats;
    if (status !== undefined) {
      updateData.status = status;
      if (status === "completed") {
        updateData.completedAt = new Date();
      }
    }

    const updatedSession = await prisma.testSession.update({
      where: { sessionId },
      data: updateData,
    });

    return new Response(JSON.stringify({ session: updatedSession, message: "Test session updated successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PUT Test Session Error:", error);
    return new Response(JSON.stringify({ error: "Failed to update test session" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

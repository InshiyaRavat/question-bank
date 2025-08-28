import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

// POST handler to create a retest session
export async function POST(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { sessionId } = params;

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Session ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Find the original session
    const originalSession = await prisma.testSession.findUnique({
      where: { sessionId },
    });

    if (!originalSession || originalSession.userId !== userId) {
      return new Response(JSON.stringify({ error: "Session not found or unauthorized" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate new session ID for the retest
    const newSessionId = uuidv4();

    // Create the retest session with the same questions
    const retestSession = await prisma.testSession.create({
      data: {
        userId,
        sessionId: newSessionId,
        testType: originalSession.testType,
        questionIds: originalSession.questionIds,
        totalQuestions: originalSession.totalQuestions,
        status: "active",
        retestCount: originalSession.retestCount + 1,
      },
    });

    // Update the original session's retest count
    await prisma.testSession.update({
      where: { sessionId },
      data: {
        retestCount: originalSession.retestCount + 1,
      },
    });

    return new Response(
      JSON.stringify({
        session: retestSession,
        originalSession: originalSession,
        message: "Retest session created successfully",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("POST Retest Session Error:", error);
    return new Response(JSON.stringify({ error: "Failed to create retest session" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

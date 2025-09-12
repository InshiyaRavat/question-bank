import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Get the original test session
    const originalSession = await prisma.testSession.findUnique({
      where: { sessionId }
    });

    if (!originalSession) {
      return NextResponse.json({ error: "Test session not found" }, { status: 404 });
    }

    if (originalSession.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized to retake this test" }, { status: 403 });
    }

    // Check retake limit
    const retakeLimit = await prisma.userRetakeLimit.findUnique({
      where: { userId }
    });

    const maxRetakes = retakeLimit?.maxRetakes ?? -1; // -1 means unlimited
    if (maxRetakes !== -1 && originalSession.retestCount >= maxRetakes) {
      return NextResponse.json({ 
        error: `Maximum retakes limit reached (${maxRetakes})`,
        maxRetakes,
        currentRetakes: originalSession.retestCount
      }, { status: 400 });
    }

    // Create a new test session for retake
    const newSessionId = `${sessionId}_retake_${Date.now()}`;
    const newSession = await prisma.testSession.create({
      data: {
        userId: originalSession.userId,
        sessionId: newSessionId,
        testType: originalSession.testType,
        questionIds: originalSession.questionIds,
        startedAt: new Date(),
        totalQuestions: originalSession.totalQuestions,
        status: "active",
        retestCount: originalSession.retestCount + 1
      }
    });

    // Update the original session's retest count
    await prisma.testSession.update({
      where: { sessionId },
      data: { retestCount: originalSession.retestCount + 1 }
    });

    return NextResponse.json({
      success: true,
      session: {
        sessionId: newSession.sessionId,
        testType: newSession.testType,
        questionIds: newSession.questionIds,
        totalQuestions: newSession.totalQuestions,
        retestCount: newSession.retestCount,
        maxRetakes: maxRetakes === -1 ? "unlimited" : maxRetakes
      }
    });

  } catch (error) {
    console.error("Retake test error:", error);
    return NextResponse.json({ error: "Failed to create retake test" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's retake limit
    const retakeLimit = await prisma.userRetakeLimit.findUnique({
      where: { userId }
    });

    return NextResponse.json({
      maxRetakes: retakeLimit?.maxRetakes ?? -1, // -1 means unlimited
      isUnlimited: (retakeLimit?.maxRetakes ?? -1) === -1
    });

  } catch (error) {
    console.error("Get retake limit error:", error);
    return NextResponse.json({ error: "Failed to get retake limit" }, { status: 500 });
  }
}

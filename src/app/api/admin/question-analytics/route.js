import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

// GET - Fetch question performance analytics
export async function GET(req) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionClaims?.metadata?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get("topicId");
    const difficulty = searchParams.get("difficulty");
    const limit = parseInt(searchParams.get("limit") || "50");
    const sortBy = searchParams.get("sortBy") || "difficulty"; // difficulty, accuracy, attempts

    // Build where clause for filtering
    const whereClause = {
      deletedAt: null, // Only active questions
      ...(topicId ? { topicId: parseInt(topicId) } : {}),
      ...(difficulty && difficulty !== "all" ? { difficulty } : {}),
    };

    // Get all questions with their performance data
    const questions = await prisma.question.findMany({
      where: whereClause,
      include: {
        topic: {
          select: { id: true, name: true }
        },
        solvedQuestions: {
          select: {
            isCorrect: true,
            userId: true
          }
        }
      },
      take: limit
    });

    // Calculate performance metrics for each question
    const questionAnalytics = questions.map(question => {
      const solvedQuestions = question.solvedQuestions;
      const totalAttempts = solvedQuestions.length;
      const correctAttempts = solvedQuestions.filter(sq => sq.isCorrect).length;
      const wrongAttempts = totalAttempts - correctAttempts;
      const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
      const difficultyScore = totalAttempts > 0 ? (wrongAttempts / totalAttempts) * 100 : 0;

      return {
        id: question.id,
        questionText: question.questionText,
        topic: question.topic,
        difficulty: question.difficulty || "medium",
        tags: question.tags || [],
        totalAttempts,
        correctAttempts,
        wrongAttempts,
        accuracy: Math.round(accuracy * 100) / 100,
        difficultyScore: Math.round(difficultyScore * 100) / 100,
        explanation: question.explanation
      };
    });

    // Sort based on criteria
    let sortedQuestions = questionAnalytics;
    switch (sortBy) {
      case "difficulty":
        sortedQuestions = questionAnalytics.sort((a, b) => b.difficultyScore - a.difficultyScore);
        break;
      case "accuracy":
        sortedQuestions = questionAnalytics.sort((a, b) => b.accuracy - a.accuracy);
        break;
      case "attempts":
        sortedQuestions = questionAnalytics.sort((a, b) => b.totalAttempts - a.totalAttempts);
        break;
      default:
        sortedQuestions = questionAnalytics.sort((a, b) => b.difficultyScore - a.difficultyScore);
    }

    // Get topic-wise summary
    const topicSummary = await prisma.topic.findMany({
      where: topicId ? { id: parseInt(topicId) } : {},
      include: {
        questions: {
          where: { deletedAt: null },
          include: {
            solvedQuestions: {
              select: { isCorrect: true }
            }
          }
        }
      }
    });

    const topicAnalytics = topicSummary.map(topic => {
      const allQuestions = topic.questions;
      const totalQuestions = allQuestions.length;
      const totalAttempts = allQuestions.reduce((sum, q) => sum + q.solvedQuestions.length, 0);
      const totalCorrect = allQuestions.reduce((sum, q) => 
        sum + q.solvedQuestions.filter(sq => sq.isCorrect).length, 0
      );
      const averageAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;

      return {
        id: topic.id,
        name: topic.name,
        totalQuestions,
        totalAttempts,
        totalCorrect,
        averageAccuracy: Math.round(averageAccuracy * 100) / 100
      };
    });

    // Get overall statistics
    const totalQuestions = await prisma.question.count({
      where: { deletedAt: null }
    });

    const totalAttempts = await prisma.solvedQuestion.count();
    const totalCorrect = await prisma.solvedQuestion.count({
      where: { isCorrect: true }
    });

    const overallAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;

    // Get most difficult and easiest questions
    const mostDifficult = questionAnalytics
      .filter(q => q.totalAttempts >= 5) // Minimum 5 attempts for statistical significance
      .sort((a, b) => b.difficultyScore - a.difficultyScore)
      .slice(0, 10);

    const easiest = questionAnalytics
      .filter(q => q.totalAttempts >= 5)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        questions: sortedQuestions,
        topics: topicAnalytics,
        overall: {
          totalQuestions,
          totalAttempts,
          totalCorrect,
          overallAccuracy: Math.round(overallAccuracy * 100) / 100
        },
        mostDifficult,
        easiest
      }
    });

  } catch (error) {
    console.error("Question analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch question analytics" }, { status: 500 });
  }
}

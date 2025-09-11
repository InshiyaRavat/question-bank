import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

// GET - Export question analytics data
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
    const format = searchParams.get("format") || "csv";
    const topicId = searchParams.get("topicId");
    const difficulty = searchParams.get("difficulty");

    // Build where clause for filtering
    const whereClause = {
      deletedAt: null,
      ...(topicId ? { topicId: parseInt(topicId) } : {}),
      ...(difficulty && difficulty !== "all" ? { difficulty } : {}),
    };

    // Get questions with performance data
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
      }
    });

    // Calculate performance metrics
    const questionData = questions.map(question => {
      const solvedQuestions = question.solvedQuestions;
      const totalAttempts = solvedQuestions.length;
      const correctAttempts = solvedQuestions.filter(sq => sq.isCorrect).length;
      const wrongAttempts = totalAttempts - correctAttempts;
      const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
      const difficultyScore = totalAttempts > 0 ? (wrongAttempts / totalAttempts) * 100 : 0;

      return {
        questionId: question.id,
        questionText: question.questionText,
        topicName: question.topic.name,
        difficulty: question.difficulty || "medium",
        tags: (question.tags || []).join(", "),
        totalAttempts,
        correctAttempts,
        wrongAttempts,
        accuracy: Math.round(accuracy * 100) / 100,
        difficultyScore: Math.round(difficultyScore * 100) / 100,
        explanation: question.explanation || ""
      };
    });

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Question ID",
        "Question Text",
        "Topic",
        "Difficulty",
        "Tags",
        "Total Attempts",
        "Correct Attempts",
        "Wrong Attempts",
        "Accuracy %",
        "Difficulty Score %",
        "Explanation"
      ];

      const csvRows = [
        headers.join(","),
        ...questionData.map(row => [
          row.questionId,
          `"${row.questionText.replace(/"/g, '""')}"`,
          `"${row.topicName}"`,
          row.difficulty,
          `"${row.tags}"`,
          row.totalAttempts,
          row.correctAttempts,
          row.wrongAttempts,
          row.accuracy,
          row.difficultyScore,
          `"${row.explanation.replace(/"/g, '""')}"`
        ].join(","))
      ];

      const csvContent = csvRows.join("\n");

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="question-analytics-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    if (format === "json") {
      return new Response(JSON.stringify(questionData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="question-analytics-${new Date().toISOString().split('T')[0]}.json"`
        }
      });
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });

  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}

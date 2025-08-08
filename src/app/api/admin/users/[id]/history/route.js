import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/admin/users/[id]/history
// Returns summary of attempts per topic and solved summary
export async function GET(_req, { params }) {
  try {
    const userId = params?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const attemptedByTopic = await prisma.attemptedQuestion.findMany({
      where: { userId },
      include: {
        topic: {
          select: { id: true, name: true },
        },
      },
      orderBy: { topicId: "asc" },
    });

    const solved = await prisma.solvedQuestion.findMany({
      where: { userId },
      select: { id: true, questionId: true, isCorrect: true, solvedAt: true },
      orderBy: { solvedAt: "desc" },
    });

    const totalSolved = solved.length;
    const totalCorrect = solved.filter((s) => s.isCorrect).length;
    const accuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;

    const topics = attemptedByTopic.map((a) => ({
      topicId: a.topicId,
      topicName: a.topic?.name || `Topic ${a.topicId}`,
      questionsAttempted: a.questionsAttempted,
    }));

    return new Response(
      JSON.stringify({
        topics,
        solved: solved.slice(0, 200),
        totals: { totalSolved, totalCorrect, accuracy },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch history" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

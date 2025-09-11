import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    // Get accuracy threshold from settings
    let accuracyThreshold = 50; // Default value
    try {
      const settings = await prisma.settings.findUnique({
        where: { key: "accuracyThreshold" }
      });
      if (settings) {
        accuracyThreshold = parseInt(settings.value) || 50;
      }
    } catch (error) {
      console.log("Could not fetch accuracy threshold, using default:", error.message);
    }

    const sessions = await prisma.testSession.findMany({
      where: { userId, status: "completed" },
      orderBy: { startedAt: "desc" },
      take: 100,
    });

    console.log("Found sessions:", sessions.length);
    console.log("Sample session topicStats:", sessions[0]?.topicStats);

    const totalAttempts = sessions.length;
    const history = sessions.map((s) => ({
      sessionId: s.sessionId,
      score: s.score,
      totalQuestions: s.totalQuestions,
      correct: s.correctCount,
      incorrect: s.incorrectCount,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      testType: s.testType,
    }));

    const topicIdToStats = {};
    
    // First try to get topicStats from sessions
    for (const s of sessions) {
      const ts = s.topicStats || {};
      console.log("Processing session topicStats:", ts);
      for (const key of Object.keys(ts)) {
        if (!topicIdToStats[key]) topicIdToStats[key] = { correct: 0, wrong: 0, total: 0 };
        topicIdToStats[key].correct += ts[key].correct || 0;
        topicIdToStats[key].wrong += ts[key].wrong || 0;
        topicIdToStats[key].total += ts[key].total || 0;
      }
    }
    
    // If no topicStats found, compute from SolvedQuestion data as fallback
    if (Object.keys(topicIdToStats).length === 0) {
      console.log("No topicStats found in sessions, computing from SolvedQuestion data...");
      
      // Get all solved questions for this user from recent sessions
      const sessionIds = sessions.map(s => s.sessionId);
      const questionIds = sessions.flatMap(s => s.questionIds || []);
      
      if (questionIds.length > 0) {
        const solvedQuestions = await prisma.solvedQuestion.findMany({
          where: {
            userId,
            questionId: { in: questionIds }
          },
          include: {
            question: {
              select: { topicId: true }
            }
          }
        });
        
        console.log("Found solved questions:", solvedQuestions.length);
        
        for (const sq of solvedQuestions) {
          const topicId = sq.question.topicId.toString();
          if (!topicIdToStats[topicId]) topicIdToStats[topicId] = { correct: 0, wrong: 0, total: 0 };
          
          if (sq.isCorrect) {
            topicIdToStats[topicId].correct += 1;
          } else {
            topicIdToStats[topicId].wrong += 1;
          }
          topicIdToStats[topicId].total += 1;
        }
      }
    }
    
    console.log("Aggregated topicIdToStats:", topicIdToStats);

    const topicIds = Object.keys(topicIdToStats).map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n));
    const topics = topicIds.length > 0 ? await prisma.topic.findMany({ where: { id: { in: topicIds } } }) : [];
    const idToName = Object.fromEntries(topics.map((t) => [String(t.id), t.name]));

    const topicsReport = Object.entries(topicIdToStats)
      .map(([topicId, s]) => {
        const total = s.total || (s.correct + s.wrong);
        const accuracy = total > 0 ? Math.round((s.correct / total) * 100) : 0;
        const needsAttention = total > 0 && accuracy < accuracyThreshold; // Uses configurable threshold
        return { topicId: Number(topicId), topicName: idToName[topicId] || `Topic ${topicId}`, correct: s.correct, wrong: s.wrong, total, accuracy, needsAttention };
      })
      .sort((a, b) => a.accuracy - b.accuracy);

    return new Response(
      JSON.stringify({ 
        report: { totalAttempts, history, topics: topicsReport },
        accuracyThreshold 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("User report error", e);
    return new Response(JSON.stringify({ error: "Failed to load user report" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}



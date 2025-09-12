import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    // Get query parameters for time filtering
    const { searchParams } = new URL(req.url);
    const timeFilter = searchParams.get('timeFilter') || 'all'; // all, week, month, year, specific
    const specificMonth = searchParams.get('month'); // YYYY-MM format
    const specificYear = searchParams.get('year'); // YYYY format

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

    // Build time filter for sessions
    let timeWhereClause = { userId, status: "completed" };
    
    if (timeFilter !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (timeFilter) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'specific':
          if (specificMonth) {
            startDate = new Date(specificMonth + '-01');
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            timeWhereClause.startedAt = {
              gte: startDate,
              lt: endDate
            };
          } else if (specificYear) {
            startDate = new Date(specificYear + '-01-01');
            const endDate = new Date(specificYear + '-12-31');
            timeWhereClause.startedAt = {
              gte: startDate,
              lte: endDate
            };
          }
          break;
      }
      
      if (timeFilter !== 'specific' && startDate) {
        timeWhereClause.startedAt = { gte: startDate };
      }
    }

    const sessions = await prisma.testSession.findMany({
      where: timeWhereClause,
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

    // Get all topics to find topics left to do
    const allTopics = await prisma.topic.findMany({
      select: { id: true, name: true }
    });

    // Find topics that haven't been covered
    const coveredTopicIds = new Set(Object.keys(topicIdToStats).map(id => parseInt(id)));
    const topicsLeftToDo = allTopics
      .filter(topic => !coveredTopicIds.has(topic.id))
      .map(topic => ({
        topicId: topic.id,
        topicName: topic.name,
        status: 'not_attempted'
      }));

    // Calculate time period statistics
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const weeklyStats = sessions.filter(s => new Date(s.startedAt) >= oneWeekAgo);
    const monthlyStats = sessions.filter(s => new Date(s.startedAt) >= oneMonthAgo);
    const quarterlyStats = sessions.filter(s => new Date(s.startedAt) >= threeMonthsAgo);

    // Calculate total questions attempted and correct
    const totalQuestionsAttempted = sessions.reduce((sum, s) => sum + (s.totalQuestions || 0), 0);
    const totalQuestionsCorrect = sessions.reduce((sum, s) => sum + (s.correctCount || 0), 0);
    const totalQuestionsIncorrect = sessions.reduce((sum, s) => sum + (s.incorrectCount || 0), 0);
    const overallAccuracy = totalQuestionsAttempted > 0 ? Math.round((totalQuestionsCorrect / totalQuestionsAttempted) * 100) : 0;

    return new Response(
      JSON.stringify({ 
        report: { 
          totalAttempts, 
          history, 
          topics: topicsReport,
          topicsLeftToDo,
          timePeriodStats: {
            weekly: {
              tests: weeklyStats.length,
              questions: weeklyStats.reduce((sum, s) => sum + (s.totalQuestions || 0), 0),
              correct: weeklyStats.reduce((sum, s) => sum + (s.correctCount || 0), 0),
              accuracy: weeklyStats.length > 0 ? Math.round((weeklyStats.reduce((sum, s) => sum + (s.correctCount || 0), 0) / weeklyStats.reduce((sum, s) => sum + (s.totalQuestions || 0), 1)) * 100) : 0
            },
            monthly: {
              tests: monthlyStats.length,
              questions: monthlyStats.reduce((sum, s) => sum + (s.totalQuestions || 0), 0),
              correct: monthlyStats.reduce((sum, s) => sum + (s.correctCount || 0), 0),
              accuracy: monthlyStats.length > 0 ? Math.round((monthlyStats.reduce((sum, s) => sum + (s.correctCount || 0), 0) / monthlyStats.reduce((sum, s) => sum + (s.totalQuestions || 0), 1)) * 100) : 0
            },
            quarterly: {
              tests: quarterlyStats.length,
              questions: quarterlyStats.reduce((sum, s) => sum + (s.totalQuestions || 0), 0),
              correct: quarterlyStats.reduce((sum, s) => sum + (s.correctCount || 0), 0),
              accuracy: quarterlyStats.length > 0 ? Math.round((quarterlyStats.reduce((sum, s) => sum + (s.correctCount || 0), 0) / quarterlyStats.reduce((sum, s) => sum + (s.totalQuestions || 0), 1)) * 100) : 0
            }
          },
          overallStats: {
            totalQuestionsAttempted,
            totalQuestionsCorrect,
            totalQuestionsIncorrect,
            overallAccuracy,
            topicsCovered: topicsReport.length,
            topicsLeft: topicsLeftToDo.length,
            totalTopics: allTopics.length
          }
        },
        accuracyThreshold,
        timeFilter,
        specificMonth,
        specificYear
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("User report error", e);
    return new Response(JSON.stringify({ error: "Failed to load user report" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}



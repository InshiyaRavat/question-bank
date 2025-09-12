import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth, clerkClient } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

async function ensureAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const clerk = await clerkClient();
  const u = await clerk.users.getUser(userId);
  const role = u && u.publicMetadata ? u.publicMetadata.role : undefined;
  return role === 'admin';
}

// GET - Fetch detailed user analytics
export async function GET(req, { params }) {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = params;

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: "User ID is required" 
      }, { status: 400 });
    }

    // Get user from Clerk
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 });
    }

    console.log("Fetching details for user:", userId);

    // Get detailed test sessions
    const testSessions = await prisma.testSession.findMany({
      where: {
        userId,
        status: "completed"
      },
      orderBy: { completedAt: "desc" },
      take: 50
    });

    console.log("Test sessions found:", testSessions.length);

    // Get solved questions for detailed analysis
    const solvedQuestions = await prisma.solvedQuestion.findMany({
      where: { userId },
      include: {
        question: {
          select: {
            id: true,
            questionText: true,
            topicId: true,
            difficulty: true,
            tags: true
          }
        }
      },
      orderBy: { solvedAt: "desc" },
      take: 100
    });

    // Get subscription history
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      orderBy: { subscribedAt: "desc" }
    });

    // Calculate detailed analytics
    const totalTests = testSessions.length;
    const totalQuestions = testSessions.reduce((sum, s) => sum + (s.totalQuestions || 0), 0);
    const totalCorrect = testSessions.reduce((sum, s) => sum + (s.correctCount || 0), 0);
    const totalIncorrect = testSessions.reduce((sum, s) => sum + (s.incorrectCount || 0), 0);
    const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    // Calculate topic-wise performance
    const topicStats = {};
    const topicNames = {};

    // First try to get from test sessions
    testSessions.forEach(session => {
      if (session.topicStats) {
        try {
          const stats = typeof session.topicStats === 'string' ? 
            JSON.parse(session.topicStats) : session.topicStats;
          Object.entries(stats).forEach(([topicId, data]) => {
            if (!topicStats[topicId]) {
              topicStats[topicId] = { correct: 0, wrong: 0, total: 0 };
            }
            topicStats[topicId].correct += data.correct || 0;
            topicStats[topicId].wrong += data.wrong || 0;
            topicStats[topicId].total += data.total || 0;
          });
        } catch (e) {
          console.warn("Invalid topicStats for session:", session.id);
        }
      }
    });

    // Fallback to solved questions
    if (Object.keys(topicStats).length === 0) {
      solvedQuestions.forEach(sq => {
        const topicId = sq.question.topicId.toString();
        if (!topicStats[topicId]) {
          topicStats[topicId] = { correct: 0, wrong: 0, total: 0 };
        }
        topicStats[topicId].total += 1;
        if (sq.isCorrect) {
          topicStats[topicId].correct += 1;
        } else {
          topicStats[topicId].wrong += 1;
        }
      });
    }

    // Get topic names
    const topicIds = Object.keys(topicStats).map(id => parseInt(id)).filter(id => !isNaN(id));
    if (topicIds.length > 0) {
      const topics = await prisma.topic.findMany({
        where: { id: { in: topicIds } },
        select: { id: true, name: true }
      });
      topics.forEach(topic => {
        topicNames[topic.id.toString()] = topic.name;
      });
    }

    // Format topic performance
    const topicPerformance = Object.entries(topicStats).map(([topicId, stats]) => {
      const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      return {
        topicId: parseInt(topicId),
        topicName: topicNames[topicId] || `Topic ${topicId}`,
        correct: stats.correct,
        wrong: stats.wrong,
        total: stats.total,
        accuracy: Math.round(accuracy * 100) / 100
      };
    }).sort((a, b) => a.accuracy - b.accuracy);

    // Calculate test history with trends
    const testHistory = testSessions.map(session => {
      const accuracy = session.totalQuestions > 0 ? 
        (session.correctCount / session.totalQuestions) * 100 : 0;
      return {
        id: session.sessionId,
        testType: session.testType,
        score: session.score,
        totalQuestions: session.totalQuestions,
        correct: session.correctCount,
        incorrect: session.incorrectCount,
        accuracy: Math.round(accuracy * 100) / 100,
        startedAt: session.startedAt,
        completedAt: session.completedAt
      };
    });

    // Calculate weekly/monthly stats
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weeklyTests = testSessions.filter(s => 
      new Date(s.completedAt || s.startedAt) >= oneWeekAgo
    ).length;

    const monthlyTests = testSessions.filter(s => 
      new Date(s.completedAt || s.startedAt) >= oneMonthAgo
    ).length;

    // Get current subscription
    const currentSubscription = subscriptions.find(s => 
      new Date(s.currentPeriodEnd) > new Date() && s.status === "active"
    ) || subscriptions[0];

    // Get user name with better fallback
    const userName = user.fullName || 
                   user.firstName + (user.lastName ? ` ${user.lastName}` : '') ||
                   user.username || 
                   user.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
                   "Unknown User";

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: userName,
          email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || "No email",
          imageUrl: user.imageUrl,
          createdAt: user.createdAt,
          role: user.publicMetadata?.role || "user"
        },
        analytics: {
          totalTests,
          totalQuestions,
          totalCorrect,
          totalIncorrect,
          overallAccuracy: Math.round(overallAccuracy * 100) / 100,
          topicsCovered: topicPerformance.length,
          weeklyTests,
          monthlyTests
        },
        topicPerformance,
        testHistory,
        subscription: currentSubscription ? {
          plan: currentSubscription.duration === 6 ? "basic" : currentSubscription.duration === 12 ? "premium" : "lifetime",
          status: currentSubscription.status,
          createdAt: currentSubscription.subscribedAt,
          expiresAt: currentSubscription.currentPeriodEnd
        } : null,
        subscriptionHistory: subscriptions.map(sub => ({
          plan: sub.duration === 6 ? "basic" : sub.duration === 12 ? "premium" : "lifetime",
          status: sub.status,
          createdAt: sub.subscribedAt,
          expiresAt: sub.currentPeriodEnd
        }))
      }
    });

  } catch (error) {
    console.error("User detail error:", error);
    return NextResponse.json({ 
      success: false,
      error: "Failed to fetch user details", 
      details: error.message 
    }, { status: 500 });
  }
}

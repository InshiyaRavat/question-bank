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

// GET - Fetch user reports with analytics
export async function GET(req) {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const plan = searchParams.get("plan") || "all";
    const accuracyMin = parseFloat(searchParams.get("accuracyMin") || "0");
    const accuracyMax = parseFloat(searchParams.get("accuracyMax") || "100");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "lastActivity"; // lastActivity, accuracy, tests, name

    // Get all users from Clerk
    const clerk = await clerkClient();
    const clerkUsers = await clerk.users.getUserList({
      limit: 1000, // Adjust based on your user count
      orderBy: "created_at"
    });

    console.log("Clerk users fetched:", clerkUsers.data.length);

    // Get user analytics data
    const userIds = clerkUsers.data.map(user => user.id);

    // Get test sessions for all users
    const testSessions = await prisma.testSession.findMany({
      where: {
        userId: { in: userIds },
        status: "completed"
      },
      select: {
        userId: true,
        score: true,
        totalQuestions: true,
        correctCount: true,
        incorrectCount: true,
        startedAt: true,
        completedAt: true,
        testType: true,
        topicStats: true
      }
    });

    // Get solved questions for accuracy calculation
    const solvedQuestions = await prisma.solvedQuestion.findMany({
      where: {
        userId: { in: userIds }
      },
      select: {
        userId: true,
        isCorrect: true,
        question: {
          select: { topicId: true }
        }
      }
    });

    // Get subscription data
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: { in: userIds }
      },
      orderBy: { subscribedAt: "desc" }
    });

    // Process user data
    const userReports = clerkUsers.data.map(user => {
      const userSessions = testSessions.filter(s => s.userId === user.id);
      const userSolvedQuestions = solvedQuestions.filter(sq => sq.userId === user.id);
      const userSubscriptions = subscriptions.filter(s => s.userId === user.id);

      // Calculate analytics
      const totalTests = userSessions.length;
      const totalQuestions = userSessions.reduce((sum, s) => sum + (s.totalQuestions || 0), 0);
      const totalCorrect = userSessions.reduce((sum, s) => sum + (s.correctCount || 0), 0);
      const totalIncorrect = userSessions.reduce((sum, s) => sum + (s.incorrectCount || 0), 0);
      const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

      // Calculate topic coverage
      const topicStats = {};
      userSessions.forEach(session => {
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

      // Fallback to solved questions if no topicStats
      if (Object.keys(topicStats).length === 0) {
        userSolvedQuestions.forEach(sq => {
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

      const topicsCovered = Object.keys(topicStats).length;
      const lastActivity = userSessions.length > 0 ?
        new Date(Math.max(...userSessions.map(s => new Date(s.completedAt || s.startedAt).getTime()))) :
        new Date(user.createdAt);

      // Get current subscription
      const currentSubscription = userSubscriptions.find(s => 
        new Date(s.currentPeriodEnd) > new Date() && s.status === "active"
      ) || userSubscriptions[0];

      // Get user name with better fallback
      const userName = user.fullName || 
                     user.firstName + (user.lastName ? ` ${user.lastName}` : '') ||
                     user.username || 
                     user.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
                     "Unknown User";

      return {
        id: user.id,
        name: userName,
        email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || "No email",
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
        lastActivity: lastActivity,
        totalTests,
        totalQuestions,
        totalCorrect,
        totalIncorrect,
        overallAccuracy: Math.round(overallAccuracy * 100) / 100,
        topicsCovered,
        topicStats,
        subscription: currentSubscription ? {
          plan: currentSubscription.duration === 6 ? "basic" : currentSubscription.duration === 12 ? "premium" : "lifetime",
          status: currentSubscription.status,
          expiresAt: currentSubscription.currentPeriodEnd
        } : null,
        role: user.publicMetadata?.role || "user"
      };
    });

    // Apply filters
    let filteredUsers = userReports;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    if (plan !== "all") {
      filteredUsers = filteredUsers.filter(user =>
        user.subscription?.plan === plan
      );
    }

    if (accuracyMin > 0 || accuracyMax < 100) {
      filteredUsers = filteredUsers.filter(user =>
        user.overallAccuracy >= accuracyMin && user.overallAccuracy <= accuracyMax
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "name":
        filteredUsers.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "accuracy":
        filteredUsers.sort((a, b) => b.overallAccuracy - a.overallAccuracy);
        break;
      case "tests":
        filteredUsers.sort((a, b) => b.totalTests - a.totalTests);
        break;
      case "lastActivity":
      default:
        filteredUsers.sort((a, b) => b.lastActivity - a.lastActivity);
        break;
    }

    // Apply pagination
    const total = filteredUsers.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        filters: {
          search,
          plan,
          accuracyMin,
          accuracyMax,
          sortBy
        }
      }
    });

  } catch (error) {
    console.error("User reports error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch user reports", 
      details: error.message 
    }, { status: 500 });
  }
}

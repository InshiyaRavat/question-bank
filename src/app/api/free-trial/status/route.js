import { NextResponse } from "next/server";
import { prisma } from "@/lib/db.js";
import { getActiveSubscriptionByUser } from "@/lib/billing.js";
import { currentUser } from "@clerk/nextjs/server";

// GET /api/free-trial/status - Get user's free trial status and limits
export async function GET(req) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check if user has active subscription
    const subscription = await getActiveSubscriptionByUser(user.id);

    if (subscription) {
      // User has active subscription, no free trial restrictions
      return NextResponse.json({
        success: true,
        isFreeTrial: false,
        hasSubscription: true,
        subscription: subscription,
      });
    }

    // Get current free trial settings
    const settings = await prisma.freeTrialSettings.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!settings) {
      return NextResponse.json({
        success: true,
        isFreeTrial: false,
        hasSubscription: false,
        message: "Free trial not available",
      });
    }

    // Get user's usage for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayUsage = await prisma.userFreeTrialUsage.findMany({
      where: {
        userId: user.id,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Next day
        },
      },
    });

    const totalQuestionsUsed = todayUsage.reduce((sum, usage) => sum + usage.questionsUsed, 0);
    const questionsRemaining = Math.max(0, settings.dailyQuestionLimit - totalQuestionsUsed);

    // Get allowed topics with their names
    const allowedTopics = await prisma.topic.findMany({
      where: {
        id: { in: settings.allowedTopics },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        noOfQuestions: true,
      },
    });

    return NextResponse.json({
      success: true,
      isFreeTrial: true,
      hasSubscription: false,
      settings: {
        dailyQuestionLimit: settings.dailyQuestionLimit,
        questionsUsed: totalQuestionsUsed,
        questionsRemaining,
        allowedTopics,
        description: settings.description,
      },
      usage: todayUsage,
    });
  } catch (error) {
    console.error("Error fetching free trial status:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db.js";
import { getActiveSubscriptionByUser } from "@/lib/billing.js";
import { currentUser } from "@clerk/nextjs/server";

// POST /api/free-trial/usage - Track free trial question usage
export async function POST(req) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { topicId, questionsCount = 1 } = body;

    if (!topicId || questionsCount < 1) {
      return NextResponse.json({ error: "Topic ID and questions count are required" }, { status: 400 });
    }

    // Check if user has active subscription
    const subscription = await getActiveSubscriptionByUser(user.id);
    if (subscription) {
      return NextResponse.json({
        success: true,
        message: "User has active subscription, no free trial tracking needed",
        hasSubscription: true,
      });
    }

    // Get current free trial settings
    const settings = await prisma.freeTrialSettings.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!settings) {
      return NextResponse.json({ error: "Free trial not available" }, { status: 400 });
    }

    // Check if topic is allowed
    if (!settings.allowedTopics.includes(topicId)) {
      return NextResponse.json({ error: "This topic is not available in free trial" }, { status: 403 });
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get user's usage for today
    const todayUsage = await prisma.userFreeTrialUsage.findMany({
      where: {
        userId: user.id,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    const totalQuestionsUsed = todayUsage.reduce((sum, usage) => sum + usage.questionsUsed, 0);
    const questionsRemaining = settings.dailyQuestionLimit - totalQuestionsUsed;

    // Check if user has exceeded daily limit
    if (questionsRemaining <= 0) {
      return NextResponse.json(
        {
          error: "Daily question limit exceeded",
          limit: settings.dailyQuestionLimit,
          used: totalQuestionsUsed,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    // Check if adding these questions would exceed the limit
    if (questionsCount > questionsRemaining) {
      return NextResponse.json(
        {
          error: "Adding these questions would exceed daily limit",
          limit: settings.dailyQuestionLimit,
          used: totalQuestionsUsed,
          remaining: questionsRemaining,
          requested: questionsCount,
        },
        { status: 429 }
      );
    }

    // Update or create usage record for this topic today
    const existingUsage = todayUsage.find((usage) => usage.topicId === topicId);

    if (existingUsage) {
      // Update existing usage
      await prisma.userFreeTrialUsage.update({
        where: { id: existingUsage.id },
        data: { questionsUsed: existingUsage.questionsUsed + questionsCount },
      });
    } else {
      // Create new usage record
      await prisma.userFreeTrialUsage.create({
        data: {
          userId: user.id,
          topicId,
          date: today,
          questionsUsed: questionsCount,
        },
      });
    }

    // Return updated usage info
    const updatedUsage = await prisma.userFreeTrialUsage.findMany({
      where: {
        userId: user.id,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    const newTotalUsed = updatedUsage.reduce((sum, usage) => sum + usage.questionsUsed, 0);
    const newRemaining = settings.dailyQuestionLimit - newTotalUsed;

    return NextResponse.json({
      success: true,
      usage: {
        totalUsed: newTotalUsed,
        remaining: newRemaining,
        limit: settings.dailyQuestionLimit,
        topicUsage: updatedUsage,
      },
    });
  } catch (error) {
    console.error("Error tracking free trial usage:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

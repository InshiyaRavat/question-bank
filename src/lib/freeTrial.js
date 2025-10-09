import { prisma } from "./db.js";
import { getActiveSubscriptionByUser } from "./billing.js";

/**
 * Check if user can access free trial features
 */
export async function canAccessFreeTrial(userId) {
  // Check if user has active subscription
  const subscription = await getActiveSubscriptionByUser(userId);
  if (subscription) {
    return { canAccess: false, reason: "has_subscription", subscription };
  }

  // Check if free trial is active
  const settings = await prisma.freeTrialSettings.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!settings) {
    return { canAccess: false, reason: "trial_not_available" };
  }

  return { canAccess: true, settings };
}

/**
 * Check if user can attempt questions from a specific topic
 */
export async function canAttemptQuestions(userId, topicId, questionCount = 1) {
  const trialCheck = await canAccessFreeTrial(userId);

  if (!trialCheck.canAccess) {
    return {
      allowed: false,
      reason: trialCheck.reason,
      message:
        trialCheck.reason === "has_subscription" ? "You have an active subscription" : "Free trial not available",
    };
  }

  const settings = trialCheck.settings;

  // Check if topic is allowed
  if (!settings.allowedTopics.includes(topicId)) {
    return {
      allowed: false,
      reason: "topic_not_allowed",
      message: "This topic is not available in free trial",
    };
  }

  // Check daily usage
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayUsage = await prisma.userFreeTrialUsage.findMany({
    where: {
      userId,
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  });

  const totalUsed = todayUsage.reduce((sum, usage) => sum + usage.questionsUsed, 0);
  const remaining = settings.dailyQuestionLimit - totalUsed;

  if (remaining <= 0) {
    return {
      allowed: false,
      reason: "daily_limit_exceeded",
      message: `Daily limit of ${settings.dailyQuestionLimit} questions reached`,
      limit: settings.dailyQuestionLimit,
      used: totalUsed,
      remaining: 0,
    };
  }

  if (questionCount > remaining) {
    return {
      allowed: false,
      reason: "insufficient_remaining",
      message: `Only ${remaining} questions remaining today`,
      limit: settings.dailyQuestionLimit,
      used: totalUsed,
      remaining,
      requested: questionCount,
    };
  }

  return {
    allowed: true,
    limit: settings.dailyQuestionLimit,
    used: totalUsed,
    remaining: remaining - questionCount,
    settings,
  };
}

/**
 * Record free trial usage
 */
export async function recordFreeTrialUsage(userId, topicId, questionCount = 1) {
  const trialCheck = await canAccessFreeTrial(userId);

  if (!trialCheck.canAccess) {
    throw new Error("User cannot access free trial");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get existing usage for this topic today
  const existingUsage = await prisma.userFreeTrialUsage.findFirst({
    where: {
      userId,
      topicId,
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  });

  if (existingUsage) {
    // Update existing usage
    return prisma.userFreeTrialUsage.update({
      where: { id: existingUsage.id },
      data: { questionsUsed: existingUsage.questionsUsed + questionCount },
    });
  } else {
    // Create new usage record
    return prisma.userFreeTrialUsage.create({
      data: {
        userId,
        topicId,
        date: today,
        questionsUsed: questionCount,
      },
    });
  }
}

/**
 * Get user's free trial status and limits
 */
export async function getFreeTrialStatus(userId) {
  const trialCheck = await canAccessFreeTrial(userId);

  if (!trialCheck.canAccess) {
    return {
      isFreeTrial: false,
      hasSubscription: trialCheck.reason === "has_subscription",
      subscription: trialCheck.subscription,
    };
  }

  const settings = trialCheck.settings;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayUsage = await prisma.userFreeTrialUsage.findMany({
    where: {
      userId,
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
  });

  const totalUsed = todayUsage.reduce((sum, usage) => sum + usage.questionsUsed, 0);
  const remaining = settings.dailyQuestionLimit - totalUsed;

  // Get allowed topics with names
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

  return {
    isFreeTrial: true,
    hasSubscription: false,
    settings: {
      dailyQuestionLimit: settings.dailyQuestionLimit,
      questionsUsed: totalUsed,
      questionsRemaining: remaining,
      allowedTopics,
      description: settings.description,
    },
    usage: todayUsage,
  };
}

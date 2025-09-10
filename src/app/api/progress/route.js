import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET - Get daily progress
export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const { searchParams } = new URL(req.url);
    const planId = searchParams.get("planId");
    const days = parseInt(searchParams.get("days") || "30");

    if (!planId) {
      return new Response(JSON.stringify({ error: "Plan ID is required" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // Get daily progress for the last N days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const progress = await prisma.dailyProgress.findMany({
      where: {
        userId,
        planId: parseInt(planId),
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: "asc" }
    });

    // Calculate streak
    const today = new Date().toDateString();
    let streak = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < 365; i++) { // Check up to 1 year back
      const dateStr = currentDate.toDateString();
      const dayProgress = progress.find(p => p.date.toDateString() === dateStr);
      
      if (dayProgress && dayProgress.questionsCompleted >= dayProgress.questionsTarget) {
        streak++;
      } else {
        break;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // Calculate weekly stats
    const weeklyStats = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekProgress = progress.filter(p => 
        p.date >= weekStart && p.date <= weekEnd
      );

      const weekCompleted = weekProgress.reduce((sum, p) => sum + p.questionsCompleted, 0);
      const weekTarget = weekProgress.reduce((sum, p) => sum + p.questionsTarget, 0);
      const weekAccuracy = weekProgress.length > 0 
        ? weekProgress.reduce((sum, p) => sum + p.accuracy, 0) / weekProgress.length 
        : 0;

      weeklyStats.unshift({
        week: i + 1,
        completed: weekCompleted,
        target: weekTarget,
        accuracy: Math.round(weekAccuracy),
        days: weekProgress.length
      });
    }

    return new Response(JSON.stringify({ 
      progress,
      streak,
      weeklyStats
    }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error("Progress GET error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch progress" }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}

// POST - Update daily progress
export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const body = await req.json();
    const { planId, questionsCompleted, accuracy, timeSpent } = body;

    if (!planId) {
      return new Response(JSON.stringify({ error: "Plan ID is required" }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // Get current plan
    const plan = await prisma.studyPlan.findFirst({
      where: { id: parseInt(planId), userId }
    });

    if (!plan) {
      return new Response(JSON.stringify({ error: "Study plan not found" }), { 
        status: 404, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // Check if DailyProgress table exists
    try {
      await prisma.$queryRaw`SELECT 1 FROM "DailyProgress" LIMIT 1`;
    } catch (error) {
      console.log("DailyProgress table doesn't exist yet, skipping progress update");
      return new Response(JSON.stringify({ 
        message: "Progress tracking will be available after database migration" 
      }), { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Upsert daily progress
    const dailyProgress = await prisma.dailyProgress.upsert({
      where: {
        userId_planId_date: {
          userId,
          planId: parseInt(planId),
          date: today
        }
      },
      update: {
        questionsCompleted: { increment: questionsCompleted || 0 },
        accuracy: accuracy || 0,
        timeSpent: { increment: timeSpent || 0 }
      },
      create: {
        userId,
        planId: parseInt(planId),
        date: today,
        questionsCompleted: questionsCompleted || 0,
        questionsTarget: Math.max(plan.questionsPerDay, questionsCompleted || 1), // Ensure target is at least what was completed
        accuracy: accuracy || 0,
        timeSpent: timeSpent || 0,
        streak: 0
      }
    });

    // Update streak
    const streak = await calculateStreak(userId, parseInt(planId));
    await prisma.dailyProgress.update({
      where: { id: dailyProgress.id },
      data: { streak }
    });

    // Check for achievements
    await checkAchievements(userId, parseInt(planId), dailyProgress);

    return new Response(JSON.stringify({ 
      progress: dailyProgress,
      message: "Progress updated successfully" 
    }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error("Progress POST error:", error);
    return new Response(JSON.stringify({ error: "Failed to update progress" }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}

// Helper function to calculate streak
async function calculateStreak(userId, planId) {
  const today = new Date();
  let streak = 0;
  let currentDate = new Date(today);
  
  for (let i = 0; i < 365; i++) {
    const dayProgress = await prisma.dailyProgress.findFirst({
      where: {
        userId,
        planId,
        date: currentDate
      }
    });
    
    // Count as streak if any questions were completed (more flexible)
    if (dayProgress && dayProgress.questionsCompleted > 0) {
      streak++;
    } else {
      break;
    }
    
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return streak;
}

// Helper function to check achievements
async function checkAchievements(userId, planId, progress) {
  const achievements = [];

  // Streak achievements
  if (progress.streak === 7 && !(await hasAchievement(userId, 'streak_7'))) {
    achievements.push({
      userId,
      type: 'streak',
      title: 'Week Warrior',
      description: 'Maintained a 7-day study streak!',
      icon: '🔥',
      metadata: { streak: 7 }
    });
  }

  if (progress.streak === 30 && !(await hasAchievement(userId, 'streak_30'))) {
    achievements.push({
      userId,
      type: 'streak',
      title: 'Month Master',
      description: 'Maintained a 30-day study streak!',
      icon: '👑',
      metadata: { streak: 30 }
    });
  }

  // Accuracy achievements
  if (progress.accuracy >= 90 && !(await hasAchievement(userId, 'accuracy_90'))) {
    achievements.push({
      userId,
      type: 'accuracy',
      title: 'Accuracy Ace',
      description: 'Achieved 90% accuracy in a day!',
      icon: '🎯',
      metadata: { accuracy: 90 }
    });
  }

  // Create achievements
  if (achievements.length > 0) {
    await prisma.achievement.createMany({
      data: achievements
    });
  }
}

// Helper function to check if user has specific achievement
async function hasAchievement(userId, type) {
  const achievement = await prisma.achievement.findFirst({
    where: { userId, type }
  });
  return !!achievement;
}

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

// GET - Get current study plan
export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // Check if StudyPlan table exists
    try {
      await prisma.$queryRaw`SELECT 1 FROM "StudyPlan" LIMIT 1`;
    } catch (error) {
      console.log("StudyPlan table doesn't exist yet");
      return new Response(JSON.stringify({ plan: null }), { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // Get current active study plan
    const currentPlan = await prisma.studyPlan.findFirst({
      where: { 
        userId, 
        status: { in: ["active", "paused"] } 
      },
      include: {
        dailyProgress: {
          orderBy: { date: "desc" },
          take: 7 // Last 7 days
        }
      },
      orderBy: { createdAt: "desc" }
    });

    if (!currentPlan) {
      return new Response(JSON.stringify({ plan: null }), { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // Calculate progress (only if DailyProgress table exists)
    let totalCompleted = { _sum: { questionsCompleted: 0 } };
    try {
      await prisma.$queryRaw`SELECT 1 FROM "DailyProgress" LIMIT 1`;
      totalCompleted = await prisma.dailyProgress.aggregate({
        where: { planId: currentPlan.id },
        _sum: { questionsCompleted: true }
      });
    } catch (error) {
      console.log("DailyProgress table doesn't exist yet, using default values");
    }

    const progress = {
      totalCompleted: totalCompleted._sum.questionsCompleted || 0,
      totalQuestions: currentPlan.totalQuestions,
      completionPercentage: Math.round(((totalCompleted._sum.questionsCompleted || 0) / currentPlan.totalQuestions) * 100),
      currentDay: Math.ceil((new Date() - new Date(currentPlan.startDate)) / (1000 * 60 * 60 * 24)) + 1,
      totalDays: currentPlan.totalDays,
      streak: currentPlan.dailyProgress[0]?.streak || 0
    };

    return new Response(JSON.stringify({ 
      plan: { ...currentPlan, progress } 
    }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error("Study plan GET error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch study plan" }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}

// POST - Create new study plan
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
    const { planType, totalDays, totalQuestions, questionsPerDay } = body;

    // Check if StudyPlan table exists
    try {
      await prisma.$queryRaw`SELECT 1 FROM "StudyPlan" LIMIT 1`;
    } catch (error) {
      console.log("StudyPlan table doesn't exist yet, cannot create plan");
      return new Response(JSON.stringify({ error: "Study plan feature not available yet. Please run database migration first." }), { 
        status: 400, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // Cancel any existing active plans
    await prisma.studyPlan.updateMany({
      where: { 
        userId, 
        status: { in: ["active", "paused"] } 
      },
      data: { status: "cancelled" }
    });

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + totalDays);

    // Create new study plan
    const studyPlan = await prisma.studyPlan.create({
      data: {
        userId,
        planType,
        totalDays,
        totalQuestions,
        questionsPerDay,
        startDate,
        endDate,
        status: "active"
      }
    });

    return new Response(JSON.stringify({ 
      plan: studyPlan,
      message: "Study plan created successfully" 
    }), { 
      status: 201, 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error("Study plan POST error:", error);
    return new Response(JSON.stringify({ error: "Failed to create study plan" }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}

// PUT - Update study plan
export async function PUT(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401, 
        headers: { "Content-Type": "application/json" } 
      });
    }

    const body = await req.json();
    const { planId, status, questionsPerDay } = body;

    const updateData = {};
    if (status) updateData.status = status;
    if (questionsPerDay) updateData.questionsPerDay = questionsPerDay;

    const updatedPlan = await prisma.studyPlan.update({
      where: { 
        id: planId,
        userId 
      },
      data: updateData
    });

    return new Response(JSON.stringify({ 
      plan: updatedPlan,
      message: "Study plan updated successfully" 
    }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });

  } catch (error) {
    console.error("Study plan PUT error:", error);
    return new Response(JSON.stringify({ error: "Failed to update study plan" }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }
}

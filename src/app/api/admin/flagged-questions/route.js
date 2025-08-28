import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { logAdminActivity } from "@/lib/adminLogger";

const prisma = new PrismaClient();

function extractClientInfo(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ipAddress = forwarded ? forwarded.split(",")[0] : req.headers.get("x-real-ip") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  return { ipAddress, userAgent };
}

// GET handler to fetch flagged questions for admin
export async function GET(request) {
  try {
    const { userId, sessionClaims } = await auth();

    // Check if user is admin
    if (!userId || sessionClaims?.metadata?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized - Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const status = searchParams.get("status") || "all";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (status !== "all") {
      where.status = status;
    }

    // Get total count
    const totalFlags = await prisma.questionFlag.count({ where });

    // Get flagged questions with related data
    const flaggedQuestions = await prisma.questionFlag.findMany({
      where,
      include: {
        question: {
          include: {
            topic: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    });

    // Get flag statistics
    const flagStats = await prisma.questionFlag.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    // Get most flagged questions
    const mostFlagged = await prisma.questionFlag.groupBy({
      by: ["questionId"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });

    // Get question details for most flagged
    const mostFlaggedWithDetails = await Promise.all(
      mostFlagged.map(async (item) => {
        const question = await prisma.question.findUnique({
          where: { id: item.questionId },
          include: {
            topic: {
              include: {
                subject: true,
              },
            },
          },
        });
        return {
          question,
          flagCount: item._count.id,
        };
      })
    );

    return new Response(
      JSON.stringify({
        flags: flaggedQuestions,
        pagination: {
          page,
          limit,
          total: totalFlags,
          pages: Math.ceil(totalFlags / limit),
        },
        statistics: {
          byStatus: flagStats,
          mostFlagged: mostFlaggedWithDetails,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("GET Flagged Questions Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch flagged questions" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// POST handler for admin actions on flagged questions
export async function POST(request) {
  try {
    const { userId, sessionClaims } = await auth();

    // Check if user is admin
    if (!userId || sessionClaims?.metadata?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized - Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { action, flagId, adminNotes } = body;
    const { ipAddress, userAgent } = extractClientInfo(request);

    if (!action || !flagId) {
      return new Response(JSON.stringify({ error: "Action and flag ID are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate action
    const validActions = ["dismiss", "resolve", "pending"];
    if (!validActions.includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the flag
    const flag = await prisma.questionFlag.findUnique({
      where: { id: parseInt(flagId) },
      include: {
        question: {
          include: {
            topic: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    });

    if (!flag) {
      return new Response(JSON.stringify({ error: "Flag not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update the flag
    const updatedFlag = await prisma.questionFlag.update({
      where: { id: parseInt(flagId) },
      data: {
        status: action === "dismiss" ? "dismissed" : action === "resolve" ? "resolved" : "pending",
        reviewedAt: new Date(),
        reviewedBy: userId,
        adminNotes: adminNotes || null,
      },
    });

    // Log admin activity
    await logAdminActivity(
      userId,
      "admin", // We should get actual admin name from Clerk
      `flag_${action}`,
      "question_flag",
      flagId.toString(),
      {
        questionId: flag.questionId,
        questionText: flag.question.questionText.substring(0, 100) + "...",
        flagReason: flag.reason,
        adminNotes: adminNotes,
      },
      ipAddress,
      userAgent
    );

    return new Response(
      JSON.stringify({
        flag: updatedFlag,
        message: `Flag ${action}ed successfully`,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("POST Flagged Questions Action Error:", error);
    return new Response(JSON.stringify({ error: "Failed to process admin action" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

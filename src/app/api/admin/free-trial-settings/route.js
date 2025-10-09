import { NextResponse } from "next/server";
import { prisma } from "@/lib/db.js";
import { auth } from "@clerk/nextjs/server";
import { logAdminActivity, ADMIN_ACTIONS, RESOURCE_TYPES, extractClientInfo } from "@/lib/adminLogger";

// GET /api/admin/free-trial-settings - Get current free trial settings
export async function GET() {
  try {
    const settings = await prisma.freeTrialSettings.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      settings: settings || {
        dailyQuestionLimit: 5,
        allowedTopics: [],
        isActive: false,
        description: "Free trial allows limited daily questions from selected topics",
      },
    });
  } catch (error) {
    console.error("Error fetching free trial settings:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/free-trial-settings - Update free trial settings
export async function POST(req) {
  try {
    const { userId: adminId } = await auth();
    if (!adminId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ipAddress, userAgent } = extractClientInfo(req);
    const body = await req.json();
    const { dailyQuestionLimit, allowedTopics, isActive, description } = body;

    // Validate input
    if (dailyQuestionLimit < 1 || dailyQuestionLimit > 100) {
      return NextResponse.json({ error: "Daily question limit must be between 1 and 100" }, { status: 400 });
    }

    if (!Array.isArray(allowedTopics)) {
      return NextResponse.json({ error: "Allowed topics must be an array" }, { status: 400 });
    }

    // Get admin info for logging
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    const adminName = admin?.name || "Unknown Admin";

    // Deactivate current settings
    await prisma.freeTrialSettings.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new settings
    const newSettings = await prisma.freeTrialSettings.create({
      data: {
        dailyQuestionLimit,
        allowedTopics,
        isActive,
        description: description || "Free trial allows limited daily questions from selected topics",
        updatedBy: adminId,
      },
    });

    // Log the activity
    await logAdminActivity({
      adminId,
      adminName,
      action: ADMIN_ACTIONS.FREE_TRIAL_SETTINGS_UPDATED,
      resource: RESOURCE_TYPES.SETTINGS,
      resourceId: newSettings.id.toString(),
      details: {
        settingsType: "free_trial",
        dailyQuestionLimit,
        allowedTopicsCount: allowedTopics.length,
        isActive,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      settings: newSettings,
    });
  } catch (error) {
    console.error("Error updating free trial settings:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAdminActivityLogs, getAdminActivityStats, logAdminActivity } from "@/lib/adminLogger";

// GET /api/admin/activity-logs - Get admin activity logs with filtering and pagination
export async function GET(req) {
  try {
    const { sessionClaims } = await auth();

    // Check if user is admin
    if (sessionClaims?.metadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const filters = {
      adminId: searchParams.get("adminId") || undefined,
      action: searchParams.get("action") || undefined,
      resource: searchParams.get("resource") || undefined,
      startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")) : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")) : undefined,
      page: parseInt(searchParams.get("page")) || 1,
      limit: Math.min(parseInt(searchParams.get("limit")) || 50, 100), // Max 100 per page
    };

    // Validate date filters
    if (filters.startDate && isNaN(filters.startDate.getTime())) {
      return NextResponse.json({ error: "Invalid startDate format" }, { status: 400 });
    }
    if (filters.endDate && isNaN(filters.endDate.getTime())) {
      return NextResponse.json({ error: "Invalid endDate format" }, { status: 400 });
    }

    // Get stats if requested
    const includeStats = searchParams.get("includeStats") === "true";

    const [logsData, statsData] = await Promise.all([
      getAdminActivityLogs(filters),
      includeStats ? getAdminActivityStats(filters) : null,
    ]);

    return NextResponse.json({
      success: true,
      ...logsData,
      stats: statsData,
    });
  } catch (error) {
    console.error("Error fetching admin activity logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/activity-logs - Manually log an admin activity (for special cases)
export async function POST(req) {
  try {
    const { sessionClaims, userId } = await auth();

    // Check if user is admin
    if (sessionClaims?.metadata?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { action, resource, resourceId, details } = body;

    // Validation
    if (!action || !resource) {
      return NextResponse.json({ error: "action and resource are required" }, { status: 400 });
    }

    // Get admin info from session
    const adminName =
      sessionClaims?.firstName && sessionClaims?.lastName
        ? `${sessionClaims.firstName} ${sessionClaims.lastName}`.trim()
        : sessionClaims?.username || "Unknown Admin";

    // Extract client info
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Log the activity
    const logEntry = await logAdminActivity({
      adminId: userId,
      adminName,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      logEntry,
    });
  } catch (error) {
    console.error("Error logging admin activity:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

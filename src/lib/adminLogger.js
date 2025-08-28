import prisma from "@/lib/prisma";

/**
 * Admin Activity Logger
 * Centralized logging system for tracking all admin actions
 */

export const ADMIN_ACTIONS = {
  // User Management
  USER_CREATED: "user_created",
  USER_DELETED: "user_deleted",
  USER_BULK_DELETED: "user_bulk_deleted",
  USER_ROLE_GRANTED: "user_role_granted",
  USER_ROLE_REMOVED: "user_role_removed",
  USER_LIFETIME_GRANTED: "user_lifetime_granted",
  USER_LIFETIME_REMOVED: "user_lifetime_removed",

  // Announcement Management
  ANNOUNCEMENT_CREATED: "announcement_created",
  ANNOUNCEMENT_UPDATED: "announcement_updated",
  ANNOUNCEMENT_DELETED: "announcement_deleted",
  ANNOUNCEMENT_ACTIVATED: "announcement_activated",
  ANNOUNCEMENT_DEACTIVATED: "announcement_deactivated",

  // Subscription Management
  SUBSCRIPTION_CREATED: "subscription_created",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",
  REFUND_PROCESSED: "refund_processed",

  // System Actions
  ADMIN_LOGIN: "admin_login",
  ADMIN_LOGOUT: "admin_logout",
  SETTINGS_UPDATED: "settings_updated",

  // Security Actions
  PASSWORD_RESET_INITIATED: "password_reset_initiated",
  ACCOUNT_LOCKED: "account_locked",
  ACCOUNT_UNLOCKED: "account_unlocked",
};

export const RESOURCE_TYPES = {
  USER: "user",
  ANNOUNCEMENT: "announcement",
  SUBSCRIPTION: "subscription",
  REFUND: "refund",
  COMMENT: "comment",
  QUESTION: "question",
  SUBJECT: "subject",
  TOPIC: "topic",
  SYSTEM: "system",
};

/**
 * Log an admin activity
 * @param {Object} params - Logging parameters
 * @param {string} params.adminId - ID of the admin performing the action
 * @param {string} params.adminName - Name of the admin for quick reference
 * @param {string} params.action - Action type from ADMIN_ACTIONS
 * @param {string} params.resource - Resource type from RESOURCE_TYPES
 * @param {string|null} params.resourceId - ID of the affected resource
 * @param {Object|null} params.details - Additional details about the action
 * @param {string|null} params.ipAddress - IP address of the admin
 * @param {string|null} params.userAgent - Browser/user agent information
 * @returns {Promise<Object>} - The created log entry
 */
export async function logAdminActivity({
  adminId,
  adminName,
  action,
  resource,
  resourceId = null,
  details = null,
  ipAddress = null,
  userAgent = null,
}) {
  try {
    const logEntry = await prisma.adminActivityLog.create({
      data: {
        adminId,
        adminName,
        action,
        resource,
        resourceId,
        details: details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent,
      },
    });

    console.log(
      `[ADMIN LOG] ${adminName} (${adminId}) performed ${action} on ${resource}${resourceId ? ` (${resourceId})` : ""}`
    );

    return logEntry;
  } catch (error) {
    console.error("Failed to log admin activity:", error);
    // Don't throw error to avoid breaking the main operation
    return null;
  }
}

/**
 * Extract client information from request headers
 * @param {Request} request - The incoming request
 * @returns {Object} - Client information
 */
export function extractClientInfo(request) {
  const headers = request.headers;

  // Try to get real IP address (considering proxies)
  const ipAddress =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    headers.get("x-client-ip") ||
    "unknown";

  const userAgent = headers.get("user-agent") || "unknown";

  return { ipAddress, userAgent };
}

/**
 * Create a logging wrapper for admin actions
 * @param {Object} params - Parameters for the action
 * @param {string} params.adminId - Admin ID
 * @param {string} params.adminName - Admin name
 * @param {string} params.action - Action type
 * @param {string} params.resource - Resource type
 * @param {Function} params.operation - The operation to perform
 * @param {Object} params.request - The request object (for IP/UA)
 * @returns {Function} - Wrapped operation
 */
export function withAdminLogging({ adminId, adminName, action, resource, request }) {
  const { ipAddress, userAgent } = extractClientInfo(request);

  return async (operation, resourceId = null, details = null) => {
    let result;
    let error;

    try {
      result = await operation();
    } catch (err) {
      error = err;
      throw err;
    } finally {
      // Log the activity regardless of success/failure
      await logAdminActivity({
        adminId,
        adminName,
        action: error ? `${action}_failed` : action,
        resource,
        resourceId,
        details: {
          ...details,
          success: !error,
          error: error?.message,
          timestamp: new Date().toISOString(),
        },
        ipAddress,
        userAgent,
      });
    }

    return result;
  };
}

/**
 * Get formatted admin activity logs with pagination
 * @param {Object} filters - Filtering options
 * @param {string} filters.adminId - Filter by admin ID
 * @param {string} filters.action - Filter by action type
 * @param {string} filters.resource - Filter by resource type
 * @param {Date} filters.startDate - Filter by start date
 * @param {Date} filters.endDate - Filter by end date
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.limit - Items per page (default: 50)
 * @returns {Promise<Object>} - Paginated logs with metadata
 */
export async function getAdminActivityLogs(filters = {}) {
  const { adminId, action, resource, startDate, endDate, page = 1, limit = 50 } = filters;

  const skip = (page - 1) * limit;

  // Build where clause
  const where = {};
  if (adminId) where.adminId = adminId;
  if (action) where.action = { contains: action, mode: "insensitive" };
  if (resource) where.resource = resource;
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  const [logs, totalCount] = await Promise.all([
    prisma.adminActivityLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { timestamp: "desc" },
    }),
    prisma.adminActivityLog.count({ where }),
  ]);
  console.log(logs);

  // Parse JSON details
  const formattedLogs = logs.map((log) => ({
    ...log,
    details: typeof log.details === "string" ? JSON.parse(log.details) : log.details || null,
  }));

  return {
    logs: formattedLogs,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      hasNext: page < Math.ceil(totalCount / limit),
      hasPrev: page > 1,
    },
  };
}

/**
 * Get admin activity statistics
 * @param {Object} filters - Filtering options
 * @returns {Promise<Object>} - Activity statistics
 */
export async function getAdminActivityStats(filters = {}) {
  const { startDate, endDate, adminId } = filters;

  const where = {};
  if (adminId) where.adminId = adminId;
  if (startDate || endDate) {
    where.timestamp = {};
    if (startDate) where.timestamp.gte = startDate;
    if (endDate) where.timestamp.lte = endDate;
  }

  const [totalActivities, actionStats, resourceStats, adminStats, recentActivity] = await Promise.all([
    // Total count
    prisma.adminActivityLog.count({ where }),

    // Activities by action type
    prisma.adminActivityLog.groupBy({
      by: ["action"],
      where,
      _count: { action: true },
      orderBy: { _count: { action: "desc" } },
      take: 10,
    }),

    // Activities by resource type
    prisma.adminActivityLog.groupBy({
      by: ["resource"],
      where,
      _count: { resource: true },
      orderBy: { _count: { resource: "desc" } },
    }),

    // Activities by admin (if not filtered by specific admin)
    !adminId
      ? prisma.adminActivityLog.groupBy({
          by: ["adminId", "adminName"],
          where,
          _count: { adminId: true },
          orderBy: { _count: { adminId: "desc" } },
          take: 10,
        })
      : [],

    // Recent activity (last 24 hours)
    prisma.adminActivityLog.count({
      where: {
        ...where,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    totalActivities,
    recentActivity,
    actionBreakdown: actionStats.map((stat) => ({
      action: stat.action,
      count: stat._count.action,
    })),
    resourceBreakdown: resourceStats.map((stat) => ({
      resource: stat.resource,
      count: stat._count.resource,
    })),
    adminBreakdown: adminStats.map((stat) => ({
      adminId: stat.adminId,
      adminName: stat.adminName,
      count: stat._count.adminId,
    })),
  };
}

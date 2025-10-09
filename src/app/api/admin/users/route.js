import { clerkClient, auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { logAdminActivity, ADMIN_ACTIONS, RESOURCE_TYPES, extractClientInfo } from "@/lib/adminLogger";
import { stripe } from "@/lib/stripe.js";

const prisma = new PrismaClient();

// Helper function to get admin info from auth
async function getAdminInfo() {
  const { userId, sessionClaims } = await auth();
  const adminName =
    sessionClaims?.firstName && sessionClaims?.lastName
      ? `${sessionClaims.firstName} ${sessionClaims.lastName}`.trim()
      : sessionClaims?.username || "Unknown Admin";

  return { adminId: userId, adminName };
}

// GET /api/admin/users?query=&sort=&order=&limit=&offset=
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;
    const sort = (searchParams.get("sort") || "registration_date").toLowerCase();
    const order = (searchParams.get("order") || "desc").toLowerCase(); // 'asc' | 'desc'
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const planFilterRaw = searchParams.get("plan"); // "6" | "12" | "none" | null
    const performanceMinRaw = searchParams.get("accuracyMin"); // percent int
    const performanceMaxRaw = searchParams.get("accuracyMax"); // percent int

    const planFilter = planFilterRaw ? String(planFilterRaw) : undefined;
    const accuracyMin =
      performanceMinRaw !== null && performanceMinRaw !== undefined ? parseInt(performanceMinRaw, 10) : undefined;
    const accuracyMax =
      performanceMaxRaw !== null && performanceMaxRaw !== undefined ? parseInt(performanceMaxRaw, 10) : undefined;
    console.log("query", query);
    console.log("sort", sort);
    console.log("order", order);
    console.log("limit", limit);
    console.log("offset", offset);

    // Clerk supports orderBy on a subset of fields. Map our sort keys.
    let orderBy;
    if (sort === "registration_date") {
      orderBy = order === "asc" ? "+created_at" : "-created_at";
    } else if (sort === "name") {
      // No reliable server-side order for full name; fetch then sort in-memory
      orderBy = order === "asc" ? "+created_at" : "-created_at";
    } else if (sort === "dob") {
      // No server-side order for birthday; fallback
      orderBy = order === "asc" ? "+created_at" : "-created_at";
    } else {
      orderBy = order === "asc" ? "+created_at" : "-created_at";
    }

    const clerk = await clerkClient();
    const filtersActive =
      Boolean(planFilter) ||
      accuracyMin !== undefined ||
      accuracyMax !== undefined ||
      sort === "name" ||
      sort === "dob";
    const clerkQueryOptionsBase = {
      ...(query ? { query } : {}),
      orderBy,
    };

    const clerkFetchLimit = filtersActive ? Math.max(limit, 500) : limit;
    const clerkFetchOffset = filtersActive ? 0 : offset;

    const { data, totalCount } = await clerk.users.getUserList({
      limit: clerkFetchLimit,
      offset: clerkFetchOffset,
      ...clerkQueryOptionsBase,
    });

    let users = data.map((u) => {
      const primaryEmail =
        u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ||
        u.emailAddresses?.[0]?.emailAddress ||
        null;
      const birthday = u.birthday /* YYYY-MM-DD */ || u.publicMetadata?.dob || null;
      return {
        id: u.id,
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        username: u.username || "",
        email: primaryEmail,
        imageUrl: u.imageUrl || null,
        createdAt: u.createdAt,
        birthday,
        role: u && u.publicMetadata && u.publicMetadata.role ? u.publicMetadata.role : "student",
        planDuration: null,
        accuracy: null,
        hasLifetimeAccess: false, // Will be updated below
      };
    });

    // Augment with subscription (plan) info
    if (users.length > 0) {
      const userIds = users.map((u) => u.id);
      const subscriptions = await prisma.subscription.findMany({
        where: { userId: { in: userIds } },
        orderBy: { subscribedAt: "desc" },
        select: { userId: true, duration: true, status: true, subscribedAt: true },
      });
      const latestSubByUser = new Map();
      for (const sub of subscriptions) {
        const current = latestSubByUser.get(sub.userId);
        if (!current || new Date(sub.subscribedAt) > new Date(current.subscribedAt)) {
          latestSubByUser.set(sub.userId, sub);
        }
      }
      users = users.map((u) => {
        const sub = latestSubByUser.get(u.id);
        // Consider durations >= 1200 months as lifetime access
        const hasLifetimeAccess = sub?.duration >= 1200;
        return {
          ...u,
          planDuration: hasLifetimeAccess ? null : sub?.duration ?? null,
          subscriptionStatus: sub?.status ?? null,
          hasLifetimeAccess,
        };
      });
    }

    // Augment with performance (accuracy) info
    if (users.length > 0) {
      const userIds = users.map((u) => u.id);
      const totals = await prisma.solvedQuestion.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds } },
        _count: { _all: true },
      });
      const corrects = await prisma.solvedQuestion.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds }, isCorrect: true },
        _count: { _all: true },
      });
      const totalMap = new Map(totals.map((t) => [t.userId, t._count._all]));
      const correctMap = new Map(corrects.map((t) => [t.userId, t._count._all]));
      users = users.map((u) => {
        const total = totalMap.get(u.id) || 0;
        const correct = correctMap.get(u.id) || 0;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : null;
        return { ...u, accuracy };
      });
    }

    // Apply filters for plan and performance if provided
    if (planFilter) {
      if (planFilter === "none") {
        users = users.filter((u) => !u.planDuration && !u.hasLifetimeAccess);
      } else {
        const planNum = parseInt(planFilter, 10);
        users = users.filter((u) => u.planDuration === planNum);
      }
    }

    if (accuracyMin !== undefined || accuracyMax !== undefined) {
      users = users.filter((u) => {
        if (u.accuracy === null || u.accuracy === undefined) return false;
        if (accuracyMin !== undefined && u.accuracy < accuracyMin) return false;
        if (accuracyMax !== undefined && u.accuracy > accuracyMax) return false;
        return true;
      });
    }

    // In-memory sort when needed (name, dob)
    if (sort === "name") {
      users.sort((a, b) => {
        const an = `${a.firstName} ${a.lastName}`.trim().toLowerCase();
        const bn = `${b.firstName} ${b.lastName}`.trim().toLowerCase();
        return order === "asc" ? an.localeCompare(bn) : bn.localeCompare(an);
      });
    } else if (sort === "dob") {
      users.sort((a, b) => {
        const av = a.birthday ? new Date(a.birthday).getTime() : 0;
        const bv = b.birthday ? new Date(b.birthday).getTime() : 0;
        return order === "asc" ? av - bv : bv - av;
      });
    }

    // If we expanded fetch for filters/sorts, paginate after processing
    let adjustedTotal = totalCount;
    if (filtersActive) {
      adjustedTotal = users.length;
      users = users.slice(offset, offset + limit);
    }

    return new Response(JSON.stringify({ users, totalCount: adjustedTotal }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// POST /api/admin/users
// Body: { action: "create" | "grant_admin" | "remove_admin" | "grant_student_free" | "remove_student_free" | "remove", ...payload }
export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body || {};

    if (!action) {
      return new Response(JSON.stringify({ error: "action is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const clerk = await clerkClient();

    // Create a new user in Clerk, optionally set role, and optionally grant lifetime subscription
    if (action === "create") {
      const { email, password, username, firstName, lastName, role, grantLifetime } = body;
      const { userId: adminId } = await auth();
      const { ipAddress, userAgent } = extractClientInfo(req);

      if (!email || !password) {
        return new Response(JSON.stringify({ error: "email and password are required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const created = await clerk.users.createUser({
        emailAddress: [email],
        password,
        username,
        firstName,
        lastName,
        publicMetadata: {
          role: role === "admin" ? "admin" : "student",
        },
      });

      // Optionally grant lifetime subscription (treat as long duration, e.g., 1200 months ~ 100 years)
      if (grantLifetime) {
        // Create a Stripe customer for lifetime access users
        const customer = await stripe.customers.create({
          email: email,
          metadata: {
            app_user_id: created.id,
            app: "question-bank",
            lifetime_access: "true",
          },
        });

        await prisma.subscription.create({
          data: {
            userId: created.id,
            status: "active",
            duration: 1200,
            stripeCustomerId: customer.id,
            stripeSubscriptionId: `lifetime_${created.id}_${Date.now()}`,
            stripePriceId: "lifetime_access",
            currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100 years from now
            cancelAtPeriodEnd: false,
          },
        });
      }

      // Log the activity
      await logAdminActivity({
        adminId,
        adminName: `${firstName || ""} ${lastName || ""}`.trim() || username || "Unknown Admin",
        action: ADMIN_ACTIONS.USER_CREATED,
        resource: RESOURCE_TYPES.USER,
        resourceId: created.id,
        details: {
          email,
          username,
          role: role === "admin" ? "admin" : "student",
          grantLifetime: !!grantLifetime,
        },
        ipAddress,
        userAgent,
      });

      return new Response(JSON.stringify({ success: true, userId: created.id }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Grant admin role via Clerk metadata
    if (action === "grant_admin") {
      const { userId } = body;
      const { adminId, adminName } = await getAdminInfo();
      const { ipAddress, userAgent } = extractClientInfo(req);

      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get target user info for logging
      const targetUser = await clerk.users.getUser(userId);

      await clerk.users.updateUser(userId, { publicMetadata: { role: "admin" } });

      // Log the activity
      await logAdminActivity({
        adminId,
        adminName,
        action: ADMIN_ACTIONS.USER_ROLE_GRANTED,
        resource: RESOURCE_TYPES.USER,
        resourceId: userId,
        details: {
          targetUserEmail: targetUser.emailAddresses?.[0]?.emailAddress,
          targetUserName: `${targetUser.firstName || ""} ${targetUser.lastName || ""}`.trim(),
          roleGranted: "admin",
        },
        ipAddress,
        userAgent,
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Remove admin role and set to student (with safety check to prevent removing last admin)
    if (action === "remove_admin") {
      const { userId } = body;
      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const requester = auth();
      const requesterId = requester?.userId || null;

      // Check if target is actually an admin
      const target = await clerk.users.getUser(userId);
      const targetRole = target && target.publicMetadata ? target.publicMetadata.role : undefined;
      const targetIsAdmin = targetRole === "admin";

      if (!targetIsAdmin) {
        return new Response(JSON.stringify({ error: "User is not an admin" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Count other admins besides target
      let offset = 0;
      let adminCountExcludingTarget = 0;
      while (true) {
        const { data } = await clerk.users.getUserList({ limit: 100, offset });
        if (!data || data.length === 0) break;
        for (const u of data) {
          const role = u && u.publicMetadata ? u.publicMetadata.role : undefined;
          if (role === "admin" && u.id !== userId) {
            adminCountExcludingTarget += 1;
            if (adminCountExcludingTarget >= 1) break;
          }
        }
        if (adminCountExcludingTarget >= 1) break;
        offset += data.length;
        if (offset > 5000) break; // safety bound
      }

      if (adminCountExcludingTarget === 0) {
        return new Response(JSON.stringify({ error: "Cannot remove admin role: this is the last admin." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Prevent self-demotion if only admin (though covered above)
      if (requesterId && requesterId === userId && adminCountExcludingTarget === 0) {
        return new Response(JSON.stringify({ error: "You cannot remove your own admin role as the last admin." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await clerk.users.updateUser(userId, { publicMetadata: { role: "student" } });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Grant student role and free lifetime subscription (prevent demoting last admin)
    if (action === "grant_student_free") {
      const { userId } = body;
      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const target = await clerk.users.getUser(userId);
      const targetRole = target && target.publicMetadata ? target.publicMetadata.role : undefined;
      const targetIsAdmin = targetRole === "admin";

      if (targetIsAdmin) {
        // Count other admins besides target
        let offset = 0;
        let adminCountExcludingTarget = 0;
        while (true) {
          const { data } = await clerk.users.getUserList({ limit: 100, offset });
          if (!data || data.length === 0) break;
          for (const u of data) {
            const role = u && u.publicMetadata ? u.publicMetadata.role : undefined;
            if (role === "admin" && u.id !== userId) {
              adminCountExcludingTarget += 1;
              if (adminCountExcludingTarget >= 1) break;
            }
          }
          if (adminCountExcludingTarget >= 1) break;
          offset += data.length;
          if (offset > 5000) break; // safety bound
        }
        if (adminCountExcludingTarget === 0) {
          return new Response(JSON.stringify({ error: "Cannot change role: this is the last admin." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      await clerk.users.updateUser(userId, { publicMetadata: { role: "student" } });

      // Create a Stripe customer for lifetime access users
      const customer = await stripe.customers.create({
        email: target.emailAddresses?.[0]?.emailAddress,
        metadata: {
          app_user_id: userId,
          app: "question-bank",
          lifetime_access: "true",
        },
      });

      await prisma.subscription.create({
        data: {
          userId,
          status: "active",
          duration: 1200,
          stripeCustomerId: customer.id,
          stripeSubscriptionId: `lifetime_${userId}_${Date.now()}`, // Unique identifier for lifetime access
          stripePriceId: "lifetime_access", // Special price ID for lifetime
          currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100 years from now
          cancelAtPeriodEnd: false,
        },
      });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Remove lifetime access (remove subscriptions with duration >= 1200)
    if (action === "remove_student_free") {
      const { userId } = body;
      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check if user actually has lifetime access
      const lifetimeSubscriptions = await prisma.subscription.findMany({
        where: {
          userId,
          duration: { gte: 1200 },
          status: "active",
        },
      });

      if (lifetimeSubscriptions.length === 0) {
        return new Response(JSON.stringify({ error: "User does not have lifetime access" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Remove all lifetime subscriptions (duration >= 1200)
      await prisma.subscription.deleteMany({
        where: {
          userId,
          duration: { gte: 1200 },
        },
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Remove user: delete DB records and Clerk user (prevent removing last admin; prevent self-removal if only admin)
    if (action === "remove") {
      const { userId } = body;
      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const requester = auth();
      const requesterId = requester?.userId || null;

      // Check target role
      const target = await clerk.users.getUser(userId);
      const targetRole = target && target.publicMetadata ? target.publicMetadata.role : undefined;
      const targetIsAdmin = targetRole === "admin";

      if (targetIsAdmin) {
        // Count admins besides target
        let offset = 0;
        let adminCountExcludingTarget = 0;
        while (true) {
          const { data } = await clerk.users.getUserList({ limit: 100, offset });
          if (!data || data.length === 0) break;
          for (const u of data) {
            const role = u && u.publicMetadata ? u.publicMetadata.role : undefined;
            if (role === "admin" && u.id !== userId) {
              adminCountExcludingTarget += 1;
              if (adminCountExcludingTarget >= 1) break;
            }
          }
          if (adminCountExcludingTarget >= 1) break;
          offset += data.length;
          if (offset > 5000) break; // safety bound
        }

        if (adminCountExcludingTarget === 0) {
          return new Response(JSON.stringify({ error: "Cannot remove the last admin user." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Optional: block self-delete if only admin (covered above). If more admins exist, allow.
        if (requesterId && requesterId === userId && adminCountExcludingTarget === 0) {
          return new Response(JSON.stringify({ error: "You are the only admin and cannot remove yourself." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      await prisma.$transaction([
        prisma.subscription.deleteMany({ where: { userId } }),
        prisma.attemptedQuestion.deleteMany({ where: { userId } }),
        prisma.solvedQuestion.deleteMany({ where: { userId } }),
        prisma.reply.deleteMany({ where: { userId } }),
        prisma.comment.deleteMany({ where: { userId } }),
      ]);

      await clerk.users.deleteUser(userId);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Bulk remove users: delete multiple users at once with proper validation
    if (action === "bulk_remove") {
      const { userIds } = body;
      const { adminId, adminName } = await getAdminInfo();
      const { ipAddress, userAgent } = extractClientInfo(req);

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return new Response(JSON.stringify({ error: "userIds array is required and cannot be empty" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Limit bulk operations to prevent abuse
      if (userIds.length > 50) {
        return new Response(JSON.stringify({ error: "Cannot delete more than 50 users at once" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const requester = auth();
      const requesterId = requester?.userId || null;

      // Prevent self-deletion in bulk operations
      if (requesterId && userIds.includes(requesterId)) {
        return new Response(JSON.stringify({ error: "Cannot delete your own account in bulk operations" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get all target users and check their roles
      const targets = await Promise.all(
        userIds.map(async (userId) => {
          try {
            const user = await clerk.users.getUser(userId);
            const role = user?.publicMetadata?.role || "student";
            return { id: userId, role, user };
          } catch (error) {
            return { id: userId, role: null, user: null, error: true };
          }
        })
      );

      // Check for invalid user IDs
      const invalidUsers = targets.filter((t) => t.error);
      if (invalidUsers.length > 0) {
        return new Response(
          JSON.stringify({
            error: `Invalid user IDs: ${invalidUsers.map((u) => u.id).join(", ")}`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Count admins in the target list
      const adminTargets = targets.filter((t) => t.role === "admin");

      if (adminTargets.length > 0) {
        // Count total admins in the system
        let offset = 0;
        let totalAdmins = 0;
        while (true) {
          const { data } = await clerk.users.getUserList({ limit: 100, offset });
          if (!data || data.length === 0) break;
          for (const u of data) {
            const role = u?.publicMetadata?.role;
            if (role === "admin") {
              totalAdmins += 1;
            }
          }
          offset += data.length;
          if (offset > 5000) break; // safety bound
        }

        // Check if we would be removing all admins
        if (totalAdmins <= adminTargets.length) {
          return new Response(
            JSON.stringify({
              error: "Cannot delete all admin users. At least one admin must remain.",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }

      // Track successful and failed deletions
      const results = {
        successful: [],
        failed: [],
        totalProcessed: userIds.length,
      };

      // Process deletions
      for (const target of targets) {
        try {
          // Delete user data from database
          await prisma.$transaction([
            prisma.subscription.deleteMany({ where: { userId: target.id } }),
            prisma.attemptedQuestion.deleteMany({ where: { userId: target.id } }),
            prisma.solvedQuestion.deleteMany({ where: { userId: target.id } }),
            prisma.reply.deleteMany({ where: { userId: target.id } }),
            prisma.comment.deleteMany({ where: { userId: target.id } }),
            // Also delete announcement reads for this user
            prisma.announcementRead.deleteMany({ where: { userId: target.id } }),
          ]);

          // Delete user from Clerk
          await clerk.users.deleteUser(target.id);

          results.successful.push({
            id: target.id,
            name: `${target.user?.firstName || ""} ${target.user?.lastName || ""}`.trim() || "Unknown User",
          });
        } catch (error) {
          console.error(`Failed to delete user ${target.id}:`, error);
          results.failed.push({
            id: target.id,
            name: `${target.user?.firstName || ""} ${target.user?.lastName || ""}`.trim() || "Unknown User",
            error: error.message,
          });
        }
      }

      // Log the bulk delete activity
      await logAdminActivity({
        adminId,
        adminName,
        action: ADMIN_ACTIONS.USER_BULK_DELETED,
        resource: RESOURCE_TYPES.USER,
        resourceId: null, // No single resource ID for bulk operations
        details: {
          totalRequested: results.totalProcessed,
          successfulDeletions: results.successful.length,
          failedDeletions: results.failed.length,
          deletedUsers: results.successful.map((u) => ({ id: u.id, name: u.name })),
          failedUsers: results.failed.map((u) => ({ id: u.id, name: u.name, error: u.error })),
        },
        ipAddress,
        userAgent,
      });

      return new Response(
        JSON.stringify({
          success: true,
          results,
          message: `Successfully deleted ${results.successful.length} of ${results.totalProcessed} users`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin users POST error:", error);
    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

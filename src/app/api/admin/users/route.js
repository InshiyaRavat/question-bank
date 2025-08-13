import { clerkClient } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
    const accuracyMin = performanceMinRaw !== null && performanceMinRaw !== undefined ? parseInt(performanceMinRaw, 10) : undefined;
    const accuracyMax = performanceMaxRaw !== null && performanceMaxRaw !== undefined ? parseInt(performanceMaxRaw, 10) : undefined;
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
    const filtersActive = Boolean(planFilter) || accuracyMin !== undefined || accuracyMax !== undefined || sort === "name" || sort === "dob";
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
        planDuration: null,
        accuracy: null,
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
        return {
          ...u,
          planDuration: sub?.duration ?? null,
          subscriptionStatus: sub?.status ?? null,
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
        users = users.filter((u) => !u.planDuration);
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

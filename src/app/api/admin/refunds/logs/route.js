import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const reason = searchParams.get("reason");

    // Build where clause
    const where = {};

    if (status) {
      where.status = status;
    }

    if (reason) {
      where.reason = reason;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get total count for pagination
    const totalCount = await prisma.refund.count({ where });

    // Get paginated refunds
    const refunds = await prisma.refund.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Fetch usernames using Clerk (same logic as other routes)
    let refundsWithUsernames = refunds;
    try {
      const uniqueUserIds = Array.from(
        new Set(
          refunds
            .map((refund) => refund.userId)
            .filter(Boolean) // Remove null/undefined userIds
        )
      );

      if (uniqueUserIds.length > 0) {
        const clerk = await clerkClient();
        const users = await Promise.all(
          uniqueUserIds.map((uid) => clerk.users.getUser(uid).catch(() => null))
        );

        const idToUsername = new Map(
          users
            .filter(Boolean)
            .map((u) => [
              u.id,
              u.username || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.emailAddresses?.[0]?.emailAddress || u.id,
            ])
        );

        refundsWithUsernames = refunds.map((refund) => ({
          ...refund,
          username: refund.userId ? (idToUsername.get(refund.userId) || refund.userId) : "unknown",
        }));
      } else {
        refundsWithUsernames = refunds.map((refund) => ({ ...refund, username: "unknown" }));
      }
    } catch (_e) {
      // If Clerk lookup fails, fall back silently to userId
      refundsWithUsernames = refunds.map((refund) => ({
        ...refund,
        username: refund.userId || "unknown",
      }));
    }

    // Calculate summary statistics - FIXED: Remove status filter for total counts
    const [totalRefunded, totalRefundCount] = await Promise.all([
      // Only sum amounts for successful refunds (makes sense for money)
      prisma.refund.aggregate({
        where: { status: "succeeded" },
        _sum: { amount: true },
      }),
      // Count ALL refunds regardless of status
      prisma.refund.count(),
    ]);

    const reasonBreakdown = await prisma.refund.groupBy({
      by: ["reason"],
      _count: { id: true },
      _sum: { amount: true },
      where: { status: "succeeded" },
    });

    const statusBreakdown = await prisma.refund.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { amount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        refunds: refundsWithUsernames,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        summary: {
          totalRefunded: totalRefunded._sum.amount || 0,
          totalRefundCount: totalRefundCount, // Now counts ALL refunds
          reasonBreakdown: reasonBreakdown.map((item) => ({
            reason: item.reason,
            count: item._count.id,
            amount: item._sum.amount || 0,
          })),
          statusBreakdown: statusBreakdown.map((item) => ({
            status: item.status,
            count: item._count.id,
            amount: item._sum.amount || 0,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching refund logs:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
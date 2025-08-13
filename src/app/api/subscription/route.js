import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userid");
  console.log("userId: ", userId);

  if (!userId) {
    return NextResponse.json({ success: false, error: "userid is required" }, { status: 400 });
  }

  try {
    let subscription = await prisma.subscription.findFirst({
      where: { userId: userId },
      orderBy: { subscribedAt: "desc" },
    });

    console.log("subscription: ", subscription);

    if (!subscription) {
      return NextResponse.json({ success: false, subscription: null });
    }

    // Auto-expire if past duration window
    try {
      const startedAt = new Date(subscription.subscribedAt);
      const expiresAt = new Date(startedAt);
      expiresAt.setMonth(expiresAt.getMonth() + (subscription.duration || 0));
      const isExpired = Date.now() > expiresAt.getTime();
      if (subscription.status === "active" && isExpired) {
        subscription = await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "inactive" },
        });
      }
      // Attach computed metadata (non-breaking for clients)
      const response = {
        ...subscription,
        expiresAt,
        daysRemaining: Math.max(
          0,
          Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        ),
      };
      return NextResponse.json({ success: true, subscription: response });
    } catch (_e) {
      return NextResponse.json({ success: true, subscription });
    }
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { userid, status, duration } = body;

    const subscription = await prisma.subscription.create({
      data: {
        userId: userid,
        status,
        duration,
        // subscribed_at will default to current time via Prisma schema
      },
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

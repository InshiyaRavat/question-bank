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
    const subscription = await prisma.subscription.findFirst({
      where: { userId: userId },
    });

    console.log("subscription: ", subscription);

    if (!subscription) {
      return NextResponse.json({ success: false, subscription: null });
    }

    return NextResponse.json({ success: true, subscription });
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

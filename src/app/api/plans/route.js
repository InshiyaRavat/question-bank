import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: [{ price: "asc" }, { durationMonths: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        currency: true,
        durationMonths: true,
        features: true,
        stripePriceId: true,
      },
    });
    return NextResponse.json({ success: true, plans });
  } catch (error) {
    console.error("Public plans GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch plans" }, { status: 500 });
  }
}



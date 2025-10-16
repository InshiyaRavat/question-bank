import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

async function ensurePlansTable() {
  try {
    await prisma.$queryRaw`SELECT 1 FROM "SubscriptionPlan" LIMIT 1`;
  } catch (e) {
    // Attempt to create table if it doesn't exist (for environments without migration)
    try {
      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
        "id" SERIAL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "price" DOUBLE PRECISION NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'USD',
        "duration_months" INTEGER NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "stripe_product_id" TEXT,
        "stripe_price_id" TEXT,
        "features" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`;
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "SubscriptionPlan_name_duration_idx" ON "SubscriptionPlan"("name", "duration_months");`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "SubscriptionPlan_is_active_idx" ON "SubscriptionPlan"("is_active");`;
    } catch (err) {
      console.warn("Failed ensuring SubscriptionPlan table:", err.message);
    }
  }
}

function requireAdmin(sessionClaims) {
  return sessionClaims?.metadata?.role === "admin";
}

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(sessionClaims)) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    await ensurePlansTable();
    const plans = await prisma.subscriptionPlan.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, plans });
  } catch (error) {
    console.error("Plans GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch plans" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(sessionClaims)) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    await ensurePlansTable();
    const body = await req.json();
    const { name, description, price, currency = "USD", durationMonths, isActive = true, features = [], stripeProductId, stripePriceId } = body;

    if (!name || !price || !durationMonths) {
      return NextResponse.json({ success: false, error: "name, price, durationMonths are required" }, { status: 400 });
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: String(name).trim(),
        description: description ? String(description) : null,
        price: Number(price),
        currency: String(currency).toUpperCase(),
        durationMonths: Number(durationMonths),
        isActive: Boolean(isActive),
        features: Array.isArray(features) ? features.map(String) : [],
        stripeProductId: stripeProductId || null,
        stripePriceId: stripePriceId || null,
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("Plans POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create plan" }, { status: 500 });
  }
}



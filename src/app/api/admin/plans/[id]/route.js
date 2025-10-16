import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

function requireAdmin(sessionClaims) {
  return sessionClaims?.metadata?.role === "admin";
}

export async function PATCH(req, { params }) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(sessionClaims)) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const id = Number(params.id);
    const body = await req.json();
    const { name, description, price, currency, durationMonths, isActive, features, stripeProductId, stripePriceId } = body;

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(description !== undefined ? { description: description ? String(description) : null } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(currency !== undefined ? { currency: String(currency).toUpperCase() } : {}),
        ...(durationMonths !== undefined ? { durationMonths: Number(durationMonths) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(features !== undefined ? { features: Array.isArray(features) ? features.map(String) : [] } : {}),
        ...(stripeProductId !== undefined ? { stripeProductId: stripeProductId || null } : {}),
        ...(stripePriceId !== undefined ? { stripePriceId: stripePriceId || null } : {}),
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("Plan PATCH error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update plan" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!requireAdmin(sessionClaims)) return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const id = Number(params.id);
    await prisma.subscriptionPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Plan DELETE error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to delete plan" }, { status: 500 });
  }
}



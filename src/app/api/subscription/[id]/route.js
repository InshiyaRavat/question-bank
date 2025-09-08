import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(req, { params }) {
  const { id } = await params;
  const body = await req.json();
  const { duration, subscribedAt, status, currentPeriodEnd, stripeCustomerId, stripeSubscriptionId, stripePriceId } =
    body;

  try {
    const updateData = {};

    if (duration !== undefined) updateData.duration = duration;
    if (subscribedAt) updateData.subscribedAt = new Date(subscribedAt);
    if (status) updateData.status = status;
    if (currentPeriodEnd) updateData.currentPeriodEnd = new Date(currentPeriodEnd);
    if (stripeCustomerId) updateData.stripeCustomerId = stripeCustomerId;
    if (stripeSubscriptionId) updateData.stripeSubscriptionId = stripeSubscriptionId;
    if (stripePriceId) updateData.stripePriceId = stripePriceId;

    const updated = await prisma.subscription.update({
      where: { id: Number(id) },
      data: updateData,
    });

    return NextResponse.json({ success: true, subscription: updated });
  } catch (error) {
    console.error("Error updating subscription:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

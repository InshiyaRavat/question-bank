import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth.js";
import { prisma } from "@/lib/db.js";
import { stripe } from "@/lib/stripe.js";
import { getActiveSubscriptionByUser } from "@/lib/billing.js";

export async function POST(req) {
  try {
    const userId = await requireUserId();
    const { mode = "period_end" } = await req.json(); // "period_end" | "immediate"

    const sub = await getActiveSubscriptionByUser(userId);
    if (!sub) return NextResponse.json({ error: "No active subscription" }, { status: 400 });

    let updated;
    if (mode === "immediate") {
      updated = await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
    } else {
      updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    await prisma.subscription.update({
      where: { stripeSubscriptionId: sub.stripeSubscriptionId },
      data: {
        status: updated.status,
        cancelAtPeriodEnd: updated.cancel_at_period_end,
        currentPeriodEnd: new Date(updated.current_period_end * 1000),
      },
    });

    return NextResponse.json({ ok: true, subscription: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

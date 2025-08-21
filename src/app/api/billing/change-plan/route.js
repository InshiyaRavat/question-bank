import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth.js";
import { prisma } from "@/lib/db.js";
import { stripe } from "@/lib/stripe.js";
import { getActiveSubscriptionByUser } from "@/lib/billing.js";

export async function POST(req) {
    try {
        const userId = requireUserId();
        const { newPriceId } = await req.json();
        if (!newPriceId) return NextResponse.json({ error: "newPriceId is required" }, { status: 400 });

        const sub = await getActiveSubscriptionByUser(userId);
        if (!sub) return NextResponse.json({ error: "No active subscription" }, { status: 400 });

        const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);

        const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
            proration_behavior: "create_prorations",
            items: [{
                id: stripeSub.items.data[0].id,
                price: newPriceId,
            }],
            cancel_at_period_end: false,
        });

        await prisma.subscription.update({
            where: { stripeSubscriptionId: sub.stripeSubscriptionId },
            data: {
                stripePriceId: newPriceId,
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

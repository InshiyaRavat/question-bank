import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth.js";
import { prisma } from "@/lib/db.js";
import { stripe } from "@/lib/stripe.js";
import { getActiveSubscriptionByUser, ensureStripeCustomer } from "@/lib/billing.js";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(req) {
    try {
        const userId = requireUserId();
        const { mode = "auto", priceId } = await req.json(); // "auto" | "resume" | "renew_now"

        let sub = await getActiveSubscriptionByUser(userId);

        // If there is no active subscription and user clicked renew: create a new one
        if (!sub) {
            if (!priceId) return NextResponse.json({ error: "priceId required to start a new subscription" }, { status: 400 });

            const me = await currentUser();
            const customerId = await ensureStripeCustomer({ userId, email: me?.emailAddresses?.[0]?.emailAddress });

            const created = await stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: priceId }],
                // If you want to confirm right away without payment intents UI:
                // payment_behavior: "default_incomplete", expand: ["latest_invoice.payment_intent"]
            });

            const saved = await prisma.subscription.create({
                data: {
                    userId,
                    status: created.status,
                    duration: priceId.includes("6") ? 6 : 12, // naive; adjust if needed
                    stripeCustomerId: customerId,
                    stripeSubscriptionId: created.id,
                    stripePriceId: priceId,
                    currentPeriodEnd: new Date(created.current_period_end * 1000),
                    cancelAtPeriodEnd: created.cancel_at_period_end || false,
                },
            });

            return NextResponse.json({ ok: true, subscription: created, saved });
        }

        // We have an active/trialing/past_due sub:
        const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);

        if (mode === "auto") {
            return NextResponse.json({ ok: true, message: "Auto-renew is handled by Stripe unless cancel_at_period_end is true." });
        }

        if (mode === "resume") {
            if (stripeSub.cancel_at_period_end) {
                const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
                    cancel_at_period_end: false,
                });
                await prisma.subscription.update({
                    where: { stripeSubscriptionId: sub.stripeSubscriptionId },
                    data: {
                        status: updated.status,
                        cancelAtPeriodEnd: updated.cancel_at_period_end,
                        currentPeriodEnd: new Date(updated.current_period_end * 1000),
                    },
                });
                return NextResponse.json({ ok: true, subscription: updated, message: "Subscription resumed." });
            }
            return NextResponse.json({ ok: true, message: "Subscription was not set to cancel." });
        }

        // renew_now: start a fresh cycle today
        const targetPrice = priceId || stripeSub.items.data[0].price.id;

        const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
            items: [{ id: stripeSub.items.data[0].id, price: targetPrice }],
            billing_cycle_anchor: "now",
            proration_behavior: "none",
            cancel_at_period_end: false,
        });

        await prisma.subscription.update({
            where: { stripeSubscriptionId: sub.stripeSubscriptionId },
            data: {
                stripePriceId: targetPrice,
                status: updated.status,
                cancelAtPeriodEnd: updated.cancel_at_period_end,
                currentPeriodEnd: new Date(updated.current_period_end * 1000),
            },
        });

        return NextResponse.json({ ok: true, subscription: updated, message: "Cycle reset to today." });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: e.status || 500 });
    }
}

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe.js";
import { prisma } from "@/lib/db.js";

export async function POST(req) {
    const body = await req.text();
    const sig = headers().get("stripe-signature");
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, secret);
    } catch (err) {
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    try {
        switch (event.type) {
            case "customer.subscription.created":
            case "customer.subscription.updated": {
                const s = event.data.object; // Stripe subscription
                await prisma.subscription.upsert({
                    where: { stripeSubscriptionId: s.id },
                    create: {
                        // We identify by stripe customer — make sure such a subscription exists for this user.
                        // If you can’t find a user by customer, skip create or log for manual link.
                        userId: (await prisma.subscription.findFirst({
                            where: { stripeCustomerId: s.customer },
                            select: { userId: true },
                        }))?.userId ?? "UNKNOWN",
                        status: s.status,
                        duration: 0, // optional; you can infer from price metadata if you store it there
                        stripeCustomerId: s.customer,
                        stripeSubscriptionId: s.id,
                        stripePriceId: s.items.data[0].price.id,
                        currentPeriodEnd: new Date(s.current_period_end * 1000),
                        cancelAtPeriodEnd: !!s.cancel_at_period_end,
                    },
                    update: {
                        status: s.status,
                        stripePriceId: s.items.data[0].price.id,
                        currentPeriodEnd: new Date(s.current_period_end * 1000),
                        cancelAtPeriodEnd: !!s.cancel_at_period_end,
                    },
                });
                break;
            }
            case "customer.subscription.deleted": {
                const s = event.data.object;
                await prisma.subscription.updateMany({
                    where: { stripeSubscriptionId: s.id },
                    data: { status: "canceled", cancelAtPeriodEnd: false },
                });
                break;
            }
            case "invoice.payment_succeeded": {
                const inv = event.data.object;
                if (inv.subscription) {
                    const s = await stripe.subscriptions.retrieve(inv.subscription);
                    await prisma.subscription.updateMany({
                        where: { stripeSubscriptionId: s.id },
                        data: {
                            status: s.status,
                            currentPeriodEnd: new Date(s.current_period_end * 1000),
                            cancelAtPeriodEnd: !!s.cancel_at_period_end,
                        },
                    });
                }
                break;
            }
            default:
                // add logs if needed
                break;
        }
        return NextResponse.json({ received: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// App router uses the raw body (we called req.text()), so no extra config needed.

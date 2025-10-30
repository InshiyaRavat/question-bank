import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const { newPriceId } = await req.json();

    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    if (!subscription) return new Response("No subscription found", { status: 404 });

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        items: [
            {
                id: subscription.stripeSubscriptionId, // subscription item ID needed
                price: newPriceId,
            },
        ],
        proration_behavior: "create_prorations",
    });

    await prisma.subscription.update({
        where: { userId },
        data: { stripePriceId: newPriceId },
    });

    return new Response("Subscription upgraded");
}

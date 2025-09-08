import { prisma } from "./db.js";
import { stripe } from "./stripe.js";

export async function getActiveSubscriptionByUser(userId) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["active", "trialing", "past_due", "incomplete"] },
    },
    orderBy: { subscribedAt: "desc" },
  });
}

// Create Stripe customer if missing, return id.
// You can enrich metadata with your userId for traceability.
export async function ensureStripeCustomer({ userId, email }) {
  // Look for any existing subscription to reuse its customer
  const existing = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { id: "desc" },
    select: { stripeCustomerId: true },
  });
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;

  const customer = await stripe.customers.create({
    email,
    metadata: { app_user_id: userId },
  });
  return customer.id;
}

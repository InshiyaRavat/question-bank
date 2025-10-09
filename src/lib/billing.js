import { prisma } from "./db.js";
import { stripe } from "./stripe.js";

/**
 * Get active subscription for a user
 */
export async function getActiveSubscriptionByUser(userId) {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ["active", "trialing", "past_due", "incomplete"] },
    },
    orderBy: { subscribedAt: "desc" },
  });
}

/**
 * Get all subscriptions for a user (including inactive)
 */
export async function getAllSubscriptionsByUser(userId) {
  return prisma.subscription.findMany({
    where: { userId },
    orderBy: { subscribedAt: "desc" },
  });
}

/**
 * Create Stripe customer if missing, return id.
 * You can enrich metadata with your userId for traceability.
 */
export async function ensureStripeCustomer({ userId, email }) {
  // Look for any existing subscription to reuse its customer
  const existing = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { id: "desc" },
    select: { stripeCustomerId: true },
  });

  if (existing?.stripeCustomerId) {
    // Verify the customer still exists in Stripe
    try {
      await stripe.customers.retrieve(existing.stripeCustomerId);
      return existing.stripeCustomerId;
    } catch (error) {
      console.warn("Existing Stripe customer not found, creating new one:", error.message);
    }
  }

  // Try to find/reuse by email to avoid duplicate customers
  if (email) {
    try {
      const list = await stripe.customers.list({ email, limit: 1 });
      const match = list?.data?.[0];
      if (match?.id) {
        // Backfill this customer id across user's subscriptions for future reuse
        await prisma.subscription.updateMany({
          where: { userId },
          data: { stripeCustomerId: match.id },
        });
        return match.id;
      }
    } catch (_e) {
      // ignore
    }
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      app_user_id: userId,
      app: "question-bank",
    },
  });

  // Backfill for future lookups
  await prisma.subscription.updateMany({
    where: { userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(userId) {
  const subscription = await getActiveSubscriptionByUser(userId);
  return !!subscription;
}

/**
 * Get subscription status for a user
 */
export async function getSubscriptionStatus(userId) {
  const subscription = await getActiveSubscriptionByUser(userId);

  if (!subscription) {
    return {
      hasSubscription: false,
      status: null,
      expiresAt: null,
      daysRemaining: null,
      isActive: false,
    };
  }

  const now = new Date();
  const expiresAt = subscription.currentPeriodEnd;
  const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isActive = subscription.status === "active" && daysRemaining > 0;

  return {
    hasSubscription: true,
    status: subscription.status,
    expiresAt,
    daysRemaining,
    isActive,
    subscription,
  };
}

import { prisma } from "@/lib/db.js";

export async function getLatestSubscription(userId) {
  return prisma.subscription.findFirst({
    where: { userId },
    orderBy: { subscribedAt: "desc" },
  });
}

export async function setStripeCustomerForUser(userId, customerId) {
  return prisma.subscription.updateMany({
    where: { userId },
    data: { stripeCustomerId: customerId },
  });
}

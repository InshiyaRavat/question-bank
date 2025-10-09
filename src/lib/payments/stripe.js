import { stripe, STRIPE_CONFIG, getDurationByPriceId } from "@/lib/stripe.js";
import { prisma } from "@/lib/db.js";

export async function verifyAndParseStripeEvent(req) {
  const body = await req.text();
  const hdrs = await (await import("next/headers")).headers();
  const sig = hdrs.get("stripe-signature");
  if (!sig) throw new Error("Missing signature");
  return stripe.webhooks.constructEvent(body, sig, STRIPE_CONFIG.WEBHOOK_SECRET);
}

export function toDateOrNowSeconds(epochSeconds) {
  const n = Number(epochSeconds);
  if (Number.isFinite(n) && n > 0) return new Date(n * 1000);
  return new Date();
}

export async function handleStripeEvent(event) {
  switch (event.type) {
    case "checkout.session.completed":
      return; // no-op; subscription events will finalize the state
    case "customer.subscription.created":
      return handleSubscriptionCreated(event.data.object);
    case "customer.subscription.updated":
      return handleSubscriptionUpdated(event.data.object);
    case "customer.subscription.deleted":
      return handleSubscriptionDeleted(event.data.object);
    case "invoice.payment_succeeded":
      return handleInvoicePaymentSucceeded(event.data.object);
    case "invoice.payment_failed":
      return handleInvoicePaymentFailed(event.data.object);
    default:
      return;
  }
}

async function handleSubscriptionCreated(subscription) {
  const userId = subscription.metadata?.userId;
  const duration =
    parseInt(subscription.metadata?.duration) || getDurationByPriceId(subscription.items.data[0].price.id);
  if (!userId) return;

  const existing = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: subscription.id } });
  if (!existing) {
    await prisma.subscription.create({
      data: {
        userId,
        status: subscription.status,
        duration: duration || 6,
        stripeCustomerId: subscription.customer,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0].price.id,
        currentPeriodEnd: toDateOrNowSeconds(subscription.current_period_end),
        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
        subscribedAt: new Date(),
      },
    });
  }
}

async function handleSubscriptionUpdated(subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status,
      stripePriceId: subscription.items.data[0].price.id,
      currentPeriodEnd: toDateOrNowSeconds(subscription.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    },
  });
}

async function handleSubscriptionDeleted(subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: "canceled", cancelAtPeriodEnd: false },
  });
}

async function handleInvoicePaymentSucceeded(invoice) {
  if (!invoice.subscription) return;
  const sub = await stripe.subscriptions.retrieve(invoice.subscription);
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: sub.id },
    data: {
      status: sub.status,
      currentPeriodEnd: toDateOrNowSeconds(sub.current_period_end),
      cancelAtPeriodEnd: sub.cancel_at_period_end || false,
    },
  });
}

async function handleInvoicePaymentFailed(invoice) {
  if (!invoice.subscription) return;
  const sub = await stripe.subscriptions.retrieve(invoice.subscription);
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: sub.id },
    data: {
      status: sub.status,
      currentPeriodEnd: toDateOrNowSeconds(sub.current_period_end),
      cancelAtPeriodEnd: sub.cancel_at_period_end || false,
    },
  });
}

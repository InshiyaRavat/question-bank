import Stripe from "stripe";

// Initialize Stripe with proper configuration
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
  appInfo: {
    name: "Question Bank",
    version: "1.0.0",
  },
});

// Stripe configuration constants
export const STRIPE_CONFIG = {
  // Product and Price IDs - these should be set in your environment
  PRODUCT_ID: process.env.STRIPE_PRODUCT_ID,
  PRICES: {
    "6_MONTH": process.env.STRIPE_PRICE_6_MONTH,
    "12_MONTH": process.env.STRIPE_PRICE_12_MONTH,
  },
  // Webhook configuration
  WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  // Currency
  CURRENCY: "gbp",
  // Success and cancel URLs for checkout sessions
  SUCCESS_URL: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/subscription/success`,
  CANCEL_URL: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/subscription/cancel`,
};

// Helper function to get price ID by duration
export function getPriceIdByDuration(duration) {
  const priceKey = duration === 6 ? "6_MONTH" : "12_MONTH";
  return STRIPE_CONFIG.PRICES[priceKey];
}

// Helper function to get duration by price ID
export function getDurationByPriceId(priceId) {
  if (priceId === STRIPE_CONFIG.PRICES["6_MONTH"]) return 6;
  if (priceId === STRIPE_CONFIG.PRICES["12_MONTH"]) return 12;
  return null;
}

// Validate Stripe configuration
export function validateStripeConfig() {
  const missing = [];

  if (!process.env.STRIPE_SECRET_KEY) missing.push("STRIPE_SECRET_KEY");
  if (!process.env.STRIPE_PRODUCT_ID) missing.push("STRIPE_PRODUCT_ID");
  if (!process.env.STRIPE_PRICE_6_MONTH) missing.push("STRIPE_PRICE_6_MONTH");
  if (!process.env.STRIPE_PRICE_12_MONTH) missing.push("STRIPE_PRICE_12_MONTH");
  if (!process.env.STRIPE_WEBHOOK_SECRET) missing.push("STRIPE_WEBHOOK_SECRET");

  if (missing.length > 0) {
    throw new Error(`Missing required Stripe environment variables: ${missing.join(", ")}`);
  }

  return true;
}

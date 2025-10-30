import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth.js";
import { stripe } from "@/lib/stripe.js";
import { prisma } from "@/lib/db.js";

/**
 * GET /api/admin/coupons
 * List all coupons from Stripe
 */
export async function GET(req) {
  try {
    const userId = await requireAdmin();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit")) || 10;
    const startingAfter = searchParams.get("starting_after");

    const params = { limit };
    if (startingAfter) {
      params.starting_after = startingAfter;
    }

    const coupons = await stripe.coupons.list(params);

    return NextResponse.json({
      coupons: coupons.data,
      has_more: coupons.has_more,
      total_count: coupons.data.length,
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

/**
 * POST /api/admin/coupons
 * Create a new coupon in Stripe
 */
export async function POST(req) {
  try {
    const userId = await requireAdmin();

    const body = await req.json();
    const {
      name,
      id,
      percent_off,
      amount_off,
      currency = "gbp",
      duration = "once",
      duration_in_months,
      max_redemptions,
      redeem_by,
      applies_to_products = [],
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Coupon name is required" }, { status: 400 });
    }

    if (!percent_off && !amount_off) {
      return NextResponse.json(
        {
          error: "Either percent_off or amount_off is required",
        },
        { status: 400 }
      );
    }

    if (percent_off && amount_off) {
      return NextResponse.json(
        {
          error: "Cannot specify both percent_off and amount_off",
        },
        { status: 400 }
      );
    }

    // Validate percent_off range
    if (percent_off && (percent_off < 0 || percent_off > 100)) {
      return NextResponse.json(
        {
          error: "percent_off must be between 0 and 100",
        },
        { status: 400 }
      );
    }

    // Validate amount_off
    if (amount_off && amount_off < 0) {
      return NextResponse.json(
        {
          error: "amount_off must be positive",
        },
        { status: 400 }
      );
    }

    // Validate duration
    if (!["once", "repeating", "forever"].includes(duration)) {
      return NextResponse.json(
        {
          error: "duration must be 'once', 'repeating', or 'forever'",
        },
        { status: 400 }
      );
    }

    // Validate duration_in_months for repeating coupons
    if (duration === "repeating" && !duration_in_months) {
      return NextResponse.json(
        {
          error: "duration_in_months is required for repeating coupons",
        },
        { status: 400 }
      );
    }

    // Prepare coupon data
    const couponData = {
      name,
      duration,
      max_redemptions: max_redemptions ? parseInt(max_redemptions) : undefined,
      redeem_by: redeem_by ? Math.floor(new Date(redeem_by).getTime() / 1000) : undefined,
    };

    // Add ID if provided
    if (id) {
      couponData.id = id;
    }

    // Add discount type
    if (percent_off) {
      couponData.percent_off = parseFloat(percent_off);
    } else {
      couponData.amount_off = parseInt(amount_off);
      couponData.currency = currency;
    }

    // Add duration_in_months for repeating coupons
    if (duration === "repeating" && duration_in_months) {
      couponData.duration_in_months = parseInt(duration_in_months);
    }

    // Add product restrictions if specified
    if (applies_to_products && applies_to_products.length > 0) {
      couponData.applies_to = {
        products: applies_to_products,
      };
    }

    // Create coupon in Stripe
    const coupon = await stripe.coupons.create(couponData);

    return NextResponse.json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);

    // Handle Stripe-specific errors
    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}

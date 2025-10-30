import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth.js";
import { stripe } from "@/lib/stripe.js";
import { prisma } from "@/lib/db.js";

/**
 * GET /api/admin/promotion-codes
 * List all promotion codes from Stripe
 */
export async function GET(req) {
  try {
    const userId = await requireAdmin();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit")) || 10;
    const startingAfter = searchParams.get("starting_after");
    const code = searchParams.get("code");

    const params = { limit };
    if (startingAfter) {
      params.starting_after = startingAfter;
    }
    if (code) {
      params.code = code;
    }

    const promotionCodes = await stripe.promotionCodes.list(params);

    return NextResponse.json({
      promotion_codes: promotionCodes.data,
      has_more: promotionCodes.has_more,
      total_count: promotionCodes.data.length,
    });
  } catch (error) {
    console.error("Error fetching promotion codes:", error);
    return NextResponse.json({ error: "Failed to fetch promotion codes" }, { status: 500 });
  }
}

/**
 * POST /api/admin/promotion-codes
 * Create a new promotion code in Stripe
 */
export async function POST(req) {
  try {
    const userId = await requireAdmin();

    const body = await req.json();
    const { coupon_id, code, active = true, max_redemptions, expires_at, restrictions = {} } = body;

    // Validate required fields
    if (!coupon_id) {
      return NextResponse.json(
        {
          error: "coupon_id is required",
        },
        { status: 400 }
      );
    }

    // Verify coupon exists
    try {
      await stripe.coupons.retrieve(coupon_id);
    } catch (error) {
      return NextResponse.json(
        {
          error: "Invalid coupon ID",
        },
        { status: 400 }
      );
    }

    // Prepare promotion code data
    const promotionCodeData = {
      coupon: coupon_id,
      active,
      max_redemptions: max_redemptions ? parseInt(max_redemptions) : undefined,
      expires_at: expires_at ? Math.floor(new Date(expires_at).getTime() / 1000) : undefined,
    };

    // Add code if provided
    if (code) {
      promotionCodeData.code = code;
    }

    // Add restrictions if provided
    if (Object.keys(restrictions).length > 0) {
      promotionCodeData.restrictions = restrictions;
    }

    // Create promotion code in Stripe
    const promotionCode = await stripe.promotionCodes.create(promotionCodeData);

    return NextResponse.json({
      success: true,
      promotion_code: promotionCode,
    });
  } catch (error) {
    console.error("Error creating promotion code:", error);

    // Handle Stripe-specific errors
    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Failed to create promotion code" }, { status: 500 });
  }
}

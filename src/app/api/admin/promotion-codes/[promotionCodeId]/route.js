import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth.js";
import { stripe } from "@/lib/stripe.js";
import { prisma } from "@/lib/db.js";

/**
 * GET /api/admin/promotion-codes/[promotionCodeId]
 * Get a specific promotion code by ID
 */
export async function GET(req, { params }) {
  try {
    const userId = await requireAdmin();

    const { promotionCodeId } = params;

    const promotionCode = await stripe.promotionCodes.retrieve(promotionCodeId);

    return NextResponse.json({ promotion_code: promotionCode });
  } catch (error) {
    console.error("Error fetching promotion code:", error);

    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json({ error: "Promotion code not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to fetch promotion code" }, { status: 500 });
  }
}

/**
 * POST /api/admin/promotion-codes/[promotionCodeId]
 * Update a promotion code
 */
export async function POST(req, { params }) {
  try {
    const userId = await requireAdmin();

    const { promotionCodeId } = params;
    const body = await req.json();
    const { active, metadata } = body;

    const updateData = {};
    if (active !== undefined) {
      updateData.active = active;
    }
    if (metadata) {
      updateData.metadata = metadata;
    }

    const promotionCode = await stripe.promotionCodes.update(promotionCodeId, updateData);

    return NextResponse.json({
      success: true,
      promotion_code: promotionCode,
    });
  } catch (error) {
    console.error("Error updating promotion code:", error);

    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json({ error: "Promotion code not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to update promotion code" }, { status: 500 });
  }
}

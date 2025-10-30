import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth.js";
import { stripe } from "@/lib/stripe.js";
import { prisma } from "@/lib/db.js";

/**
 * GET /api/admin/coupons/[couponId]
 * Get a specific coupon by ID
 */
export async function GET(req, { params }) {
  try {
    const userId = await requireAdmin();

    const { couponId } = params;

    const coupon = await stripe.coupons.retrieve(couponId);

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Error fetching coupon:", error);

    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to fetch coupon" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/coupons/[couponId]
 * Delete a coupon
 */
export async function DELETE(req, { params }) {
  try {
    const userId = await requireAdmin();

    const { couponId } = params;

    const deletedCoupon = await stripe.coupons.del(couponId);

    return NextResponse.json({
      success: true,
      coupon: deletedCoupon,
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);

    if (error.type === "StripeInvalidRequestError") {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}

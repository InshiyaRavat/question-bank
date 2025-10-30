import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe.js";

/**
 * POST /api/coupons/validate
 * Validate a coupon or promotion code
 */
export async function POST(req) {
  try {
    const { code, type = "promotion_code" } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    if (type === "promotion_code") {
      // Validate promotion code
      try {
        const promotionCodes = await stripe.promotionCodes.list({
          code: code,
          limit: 1,
        });

        if (promotionCodes.data.length === 0) {
          return NextResponse.json({
            valid: false,
            error: "Invalid promotion code",
          });
        }

        const promotionCode = promotionCodes.data[0];

        // Check if promotion code is active
        if (!promotionCode.active) {
          return NextResponse.json({
            valid: false,
            error: "Promotion code is not active",
          });
        }

        // Check if promotion code has expired
        if (promotionCode.expires_at && promotionCode.expires_at < Math.floor(Date.now() / 1000)) {
          return NextResponse.json({
            valid: false,
            error: "Promotion code has expired",
          });
        }

        // Check if max redemptions reached
        if (promotionCode.max_redemptions && promotionCode.times_redeemed >= promotionCode.max_redemptions) {
          return NextResponse.json({
            valid: false,
            error: "Promotion code has reached maximum redemptions",
          });
        }

        return NextResponse.json({
          valid: true,
          promotion_code: promotionCode,
          coupon: promotionCode.coupon,
        });
      } catch (error) {
        console.error("Error validating promotion code:", error);
        return NextResponse.json({
          valid: false,
          error: "Invalid promotion code",
        });
      }
    } else if (type === "coupon") {
      // Validate coupon directly
      try {
        const coupon = await stripe.coupons.retrieve(code);

        // Check if coupon is valid
        if (!coupon.valid) {
          return NextResponse.json({
            valid: false,
            error: "Coupon is not valid",
          });
        }

        // Check if coupon has expired
        if (coupon.redeem_by && coupon.redeem_by < Math.floor(Date.now() / 1000)) {
          return NextResponse.json({
            valid: false,
            error: "Coupon has expired",
          });
        }

        // Check if max redemptions reached
        if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) {
          return NextResponse.json({
            valid: false,
            error: "Coupon has reached maximum redemptions",
          });
        }

        return NextResponse.json({
          valid: true,
          coupon: coupon,
        });
      } catch (error) {
        console.error("Error validating coupon:", error);
        return NextResponse.json({
          valid: false,
          error: "Invalid coupon",
        });
      }
    } else {
      return NextResponse.json(
        {
          error: "Invalid type. Must be 'promotion_code' or 'coupon'",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error validating code:", error);
    return NextResponse.json({ error: "Failed to validate code" }, { status: 500 });
  }
}

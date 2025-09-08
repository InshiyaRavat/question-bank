import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, email } = body;

    if (!userId || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: userId, email",
        },
        { status: 400 }
      );
    }

    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    let customer;
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      // Create new Stripe customer
      customer = await stripe.customers.create({
        email: email,
        metadata: {
          app_user_id: userId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      customerId: customer.id,
      customer: customer,
    });
  } catch (error) {
    console.error("Error creating/retrieving Stripe customer:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

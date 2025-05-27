import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { amount } = body;
    console.log(amount)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Number(amount) * 100,
      currency: "GBP",
    });

    return new NextResponse(JSON.stringify({ clientSecret: paymentIntent.client_secret }), { status: 200 });
  } catch (error) {
    return new NextResponse(error.message || "An error occurred", {
      status: 400,
    });
  }
}


import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "edge";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  // Handle subscription events
  switch (event.type) {
    case "checkout.session.completed":
      // TODO: store subscription status (e.g. in DB or KV)
      console.log("Subscription created:", event.data.object);
      break;
    case "customer.subscription.deleted":
      console.log("Subscription cancelled:", event.data.object);
      break;
  }

  return NextResponse.json({ received: true });
}

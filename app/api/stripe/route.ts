import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || "https://image-background-remover-6ek.pages.dev";

  // Call Stripe API directly without SDK (edge compatible)
  const body = new URLSearchParams({
    mode: "subscription",
    "payment_method_types[0]": "card",
    "line_items[0][price]": process.env.STRIPE_PRICE_ID || "",
    "line_items[0][quantity]": "1",
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing`,
  });

  const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const session = await resp.json() as { url?: string; error?: { message: string } };

  if (!resp.ok) {
    return NextResponse.json({ error: session.error?.message }, { status: resp.status });
  }

  return NextResponse.json({ url: session.url });
}

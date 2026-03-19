import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  // Stripe webhook - placeholder for MVP
  // Full implementation requires Stripe SDK which is not edge-compatible
  // Handle via Node.js runtime in production
  return NextResponse.json({ received: true });
}

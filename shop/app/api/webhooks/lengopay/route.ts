import { NextRequest, NextResponse } from "next/server";
import { verifyPayment, isPaid } from "@/lib/lengopay";
import type { LengoPayWebhookPayload } from "@/types";

export async function POST(request: NextRequest) {
  // Respond 200 IMMEDIATELY — LengoPay retries on failure, which can
  // cause duplicate fulfillment if the handler is slow.
  let body: LengoPayWebhookPayload;
  try {
    body = await request.json();
    console.log("Received LengoPay webhook:", body);
  } catch {
    return new NextResponse(null, { status: 200 });
  }

  const { pay_id } = body;

  if (pay_id) {
    // Fire-and-forget — 200 is already committed before this resolves.
    // On Vercel: wrap with waitUntil() from @vercel/functions to keep
    // the serverless function alive until verification finishes.
    verifyAndFulfill(pay_id).catch((err: unknown) => {
      console.error("[lengopay/webhook] fulfillment error:", err);
    });
  }

  return new NextResponse(null, { status: 200 });
}

async function verifyAndFulfill(payId: string): Promise<void> {
  // Never trust the webhook payload alone — it carries no signature and
  // can be forged by anyone who knows your callback_url.
  const result = await verifyPayment(payId);

  if (isPaid(result.status)) {
    // Guard against duplicate delivery — LengoPay may send the same
    // webhook multiple times. In production, check DB before fulfilling.
    console.info("[lengopay/webhook] Payment confirmed:", {
      payId: result.pay_id,
      amount: result.amount,
      currency: result.currency,
      metadata: result.metadata,
    });

    // TODO: update DB, send confirmation email, etc.
  }
}

import { NextRequest, NextResponse } from "next/server";
import { verifyPayment, isPaid } from "@/lib/paycard";
import type { PaycardWebhookPayload } from "@/types";

export async function POST(request: NextRequest) {
  // Parse body — but respond 200 IMMEDIATELY regardless of content.
  // Paycard does not retry failed webhook deliveries.
  let body: PaycardWebhookPayload;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 200 });
  }

  // Handle both field name conventions (actual API uses underscores; spec uses hyphens)
  const reference =
    body.operation_reference ?? body["paycard-operation-reference"];

  if (reference) {
    // Fire-and-forget — the 200 is returned before this completes.
    // On Vercel: wrap with waitUntil() from @vercel/functions to keep
    // the serverless function alive until verification finishes.
    verifyAndFulfill(reference).catch((err: unknown) => {
      console.error("[paycard/webhook] fulfillment error:", err);
    });
  }

  return new NextResponse(null, { status: 200 });
}

async function verifyAndFulfill(reference: string): Promise<void> {
  // Always verify server-side — never trust the webhook payload alone.
  // Paycard sends no signature; anyone knowing your URL can POST to it.
  const status = await verifyPayment(reference);

  if (isPaid(status.status)) {
    // Payment confirmed — fulfill the order here.
    // In production: update DB, send confirmation email, etc.
    console.info("[paycard/webhook] Payment confirmed:", {
      reference,
      amount: status.payment_amount_formatted,
      method: status.payment_method,
      date: status.transaction_date,
    });
  }
}

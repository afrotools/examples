import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/bictorys";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { BictorysWebhookPayload, PaymentStatus } from "@/types";

const STATUS_MAP: Partial<Record<BictorysWebhookPayload["status"], PaymentStatus>> = {
  succeeded: "succeeded",
  failed: "failed",
  cancelled: "cancelled",
  reversed: "cancelled",
  // "authorized" is intentionally absent — funds reserved but not yet
  // captured, nothing to update on our side yet.
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!verifyWebhookSignature(request.headers, rawBody)) {
    console.error("[bictorys/webhook] Invalid signature — request ignored");
    return new NextResponse(null, { status: 200 });
  }

  // Respond 200 immediately — Bictorys retries up to 3x on a non-2xx status
  // and doesn't inspect the response body. Process the rest async.
  processWebhook(rawBody).catch((err: unknown) => {
    console.error("[bictorys/webhook] processing error:", err);
  });

  return new NextResponse(null, { status: 200 });
}

async function processWebhook(rawBody: string): Promise<void> {
  let payload: BictorysWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error("[bictorys/webhook] Invalid JSON body");
    return;
  }

  const nextStatus = STATUS_MAP[payload.status];
  if (!nextStatus || !payload.paymentReference) return;

  const { data: payment, error: fetchError } = await supabaseAdmin
    .from("payments")
    .select("status, amount_total, currency")
    .eq("order_reference", payload.paymentReference)
    .maybeSingle<{ status: PaymentStatus; amount_total: number; currency: string }>();

  if (fetchError) {
    console.error("[bictorys/webhook] Supabase lookup error:", fetchError.message);
    return;
  }
  if (!payment) {
    console.error(
      "[bictorys/webhook] Unknown paymentReference:",
      payload.paymentReference
    );
    return;
  }

  // Idempotency: Bictorys may redeliver the same event — a terminal status
  // already recorded means this was already processed.
  if (
    payment.status === "succeeded" ||
    payment.status === "failed" ||
    payment.status === "cancelled"
  ) {
    return;
  }

  // Anti-fraud: a forged or replayed payload could otherwise pass signature
  // checks with tampered amounts — match against our own order record.
  if (
    payment.amount_total !== payload.amount ||
    payment.currency !== payload.currency
  ) {
    console.error(
      "[bictorys/webhook] Amount/currency mismatch for",
      payload.paymentReference
    );
    return;
  }

  const { error: updateError } = await supabaseAdmin
    .from("payments")
    .update({ status: nextStatus, provider_transaction_id: payload.id })
    .eq("order_reference", payload.paymentReference);

  if (updateError) {
    console.error("[bictorys/webhook] Supabase update error:", updateError.message);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getCheckoutSessionStatus, verifyWebhookSignature } from "@/lib/saspay";
import { supabaseAdmin } from "@/lib/supabase/server";

interface SaspayWebhook {
  event: string;
  data: { id: string; amount?: string; currency?: string };
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifyWebhookSignature(request.headers, rawBody)) {
    console.error("[saspay/webhook] Invalid signature — request ignored");
    return new NextResponse(null, { status: 403 });
  }

  // 2xx right away (15s timeout, retried 5x otherwise); process in background.
  processWebhook(rawBody).catch((err: unknown) =>
    console.error("[saspay/webhook] processing error:", err)
  );
  return new NextResponse(null, { status: 200 });
}

async function processWebhook(rawBody: string): Promise<void> {
  const { event, data } = JSON.parse(rawBody) as SaspayWebhook;
  if (event !== "transaction.success") return;

  // The webhook carries the transaction id, not our order reference, so find
  // the pending SasPay orders with the same amount and let the status API
  // (source of truth) say which session that transaction belongs to.
  const { data: candidates, error } = await supabaseAdmin
    .from("payments")
    .select("order_reference, provider_transaction_id")
    .eq("provider", "saspay")
    .eq("status", "pending") // idempotency: already-paid orders are skipped
    .eq("amount_total", Math.round(Number(data.amount)))
    .eq("currency", data.currency ?? "XOF");
  if (error) throw new Error(error.message);

  for (const c of candidates ?? []) {
    const s = await getCheckoutSessionStatus(c.provider_transaction_id);
    if (s.status === "PAID" && s.transaction_status === "SUCCESS" && s.transaction_id === data.id) {
      // `.eq("status","pending")` again makes a concurrent duplicate a no-op.
      await supabaseAdmin
        .from("payments")
        .update({ status: "succeeded" })
        .eq("order_reference", c.order_reference)
        .eq("status", "pending");
      return;
    }
  }
  console.error("[saspay/webhook] No pending order matches transaction", data.id);
}

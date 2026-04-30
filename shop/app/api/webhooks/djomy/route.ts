import { NextRequest, NextResponse } from "next/server";
import { verifyPayment, isPaid } from "@/lib/djomy";
import type { DjomyWebhookPayload } from "@/types";

async function computeHmacHex(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: NextRequest) {
  // Respond 200 IMMEDIATELY — Djomy considers non-200 a delivery failure.
  const rawBody = await request.text();
  console.debug("[djomy/webhook] received raw body:", rawBody);
  const signature = request.headers.get("x-webhook-signature") ?? "";

  const clientSecret = process.env.DJOMY_CLIENT_SECRET;
  if (!clientSecret) {
    console.error("[djomy/webhook] Missing DJOMY_CLIENT_SECRET");
    return new NextResponse(null, { status: 200 });
  }

  // Fire-and-forget — 200 is already committed before this resolves.
  // On Vercel: wrap with waitUntil() from @vercel/functions to keep
  // the serverless function alive until processing finishes.
  processWebhook(rawBody, signature, clientSecret).catch((err: unknown) => {
    console.error("[djomy/webhook] processing error:", err);
  });

  return new NextResponse(null, { status: 200 });
}

async function processWebhook(
  rawBody: string,
  signature: string,
  clientSecret: string
): Promise<void> {
  // Verify HMAC-SHA256(rawBody, clientSecret) against X-Webhook-Signature header.
  // Djomy webhooks carry no other auth — anyone knowing your URL can POST to it.
  const expectedSignature = await computeHmacHex(rawBody, clientSecret);
  console.debug("[djomy/webhook] computed signature:", expectedSignature);
  console.debug("[djomy/webhook] received signature:", signature);
  if (expectedSignature !== signature) {
    console.error("[djomy/webhook] Invalid signature — request rejected");
    return;
  }

  let payload: DjomyWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error("[djomy/webhook] Invalid JSON body");
    return;
  }

  // Events: payment.created, payment.pending, payment.success, payment.failed
  // Only act on success for order fulfillment.
  if (payload.eventType !== "payment.success") {
    return;
  }

  const transactionId = payload.data?.transactionId as string | undefined;
  if (!transactionId) return;

  // Always verify server-side — never trust webhook payload alone.
  // Guard against duplicate delivery — check DB before fulfilling in production.
  const result = await verifyPayment(transactionId);

  if (isPaid(result.status)) {
    console.info("[djomy/webhook] Payment confirmed:", {
      transactionId: result.transactionId,
      amount: result.paidAmount,
      receivedAmount: result.receivedAmount, // after Djomy fees
      method: result.paymentMethod,
    });

    // TODO: update DB, send confirmation email, etc.
  }
}

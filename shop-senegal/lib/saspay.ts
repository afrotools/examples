/**
 * SasPay — hosted checkout (Sénégal, XOF)
 * Spec: afro.tools saspay/create_checkout_session + get_checkout_session_status
 * (verified in sandbox), webhook_payment_completed ("ready", untested).
 *
 * Flow: POST /checkout-sessions/ → redirect the customer to data.checkout_url.
 * Fulfilment comes only from the signed webhook, then re-confirmed with
 * get_checkout_session_status. Never from the customer's return (SasPay may
 * not even redirect back after a successful payment).
 *
 * api.saspay.me acts as production even with an sk_test_ key — set
 * SASPAY_API_BASE_URL=https://sandbox-api.saspay.me to test without real money.
 */

import { createHmac, timingSafeEqual } from "crypto";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

const baseUrl = () => process.env.SASPAY_API_BASE_URL ?? "https://api.saspay.me";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl()}/api/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env("SASPAY_API_KEY")}`,
    },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success !== true) {
    throw new Error(
      `SasPay error ${res.status}: ${json.error?.message ?? JSON.stringify(json)}`
    );
  }
  return json.data as T;
}

export function createCheckoutSession(input: {
  amount: number;
  orderReference: string;
  returnUrl: string;
  customer: { name: string; email: string; phone?: string };
}) {
  return call<{ id: string; checkout_url: string }>("/checkout-sessions/", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amount.toFixed(2), // decimal string, never a float
      currency: "XOF",
      country: "SN",
      description: `Commande ${input.orderReference}`,
      customer_name: input.customer.name,
      customer_email: input.customer.email,
      ...(input.customer.phone && { customer_phone: input.customer.phone }),
      return_url: input.returnUrl,
      metadata: { order_reference: input.orderReference },
    }),
  });
}

export function getCheckoutSessionStatus(id: string) {
  return call<{
    id: string;
    status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
    transaction_id: string | null;
    transaction_status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | null;
  }>(`/checkout-sessions/${encodeURIComponent(id)}/status/`);
}

/** HMAC-SHA256 hex of `${timestamp}.${rawBody}`, 5-minute tolerance, constant-time compare. */
export function verifyWebhookSignature(headers: Headers, rawBody: string): boolean {
  const signature = headers.get("x-webhook-signature") ?? "";
  const timestamp = headers.get("x-webhook-timestamp") ?? "";
  if (!Number.isFinite(Number(timestamp))) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", env("SASPAY_WEBHOOK_SECRET"))
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

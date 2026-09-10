/**
 * Bictorys payment gateway — hosted checkout (Sénégal, XOF)
 * Spec: afrotools/specs/payment/bictorys/ (create_charge, verify_transaction,
 * webhook_payment_completed — all "ready")
 *
 * create_charge (no payment_type query param) → POST /pay/v1/charges
 *   → HTTP 202 CheckoutLinkObject { link, chargeId, opToken }. Redirect the
 *   customer to `link`; they pick mobile money/card on Bictorys' own page.
 * verify_transaction → GET /pay/v1/transactions/{id}/status
 * webhook_payment_completed → POST to our /api/webhooks/bictorys
 *
 * Critical:
 * - create_charge uses the PUBLIC key (BICTORYS_API_KEY, header X-Api-Key).
 *   verify_transaction uses the PRIVATE key (BICTORYS_PRIVATE_KEY, header
 *   X-API-Key) — despite Bictorys' docs claiming the public key works there.
 * - successRedirectUrl / errorRedirectUrl MUST be HTTPS, or Bictorys rejects
 *   the request with E400-0. Use an HTTPS tunnel (ngrok) in local dev.
 * - Nothing is fulfillable right after create_charge returns — the customer
 *   hasn't paid, they're only about to be redirected. Never trust the
 *   redirect alone (fully spoofable); the signature-verified webhook is the
 *   only source of truth for fulfillment.
 * - The webhook may be delivered more than once — handlers must be
 *   idempotent (see app/api/webhooks/bictorys/route.ts).
 */

import { createHmac, timingSafeEqual } from "crypto";
import type { BictorysCheckoutLink, BictorysError } from "@/types";

function getApiKey(): string {
  const key = process.env.BICTORYS_API_KEY;
  if (!key) throw new Error("Missing env: BICTORYS_API_KEY");
  return key;
}

function getPrivateKey(): string {
  const key = process.env.BICTORYS_PRIVATE_KEY;
  if (!key) throw new Error("Missing env: BICTORYS_PRIVATE_KEY");
  return key;
}

function getWebhookSecret(): string {
  const secret = process.env.BICTORYS_WEBHOOK_SECRET;
  if (!secret) throw new Error("Missing env: BICTORYS_WEBHOOK_SECRET");
  return secret;
}

// Defaults to production; set BICTORYS_API_BASE_URL=https://api.test.bictorys.com
// in dev to hit the sandbox instead (sandbox and production use separate keys).
function getBaseUrl(): string {
  return process.env.BICTORYS_API_BASE_URL ?? "https://api.bictorys.com";
}

interface CreateChargeInput {
  amount: number;
  paymentReference: string;
  successRedirectUrl: string;
  errorRedirectUrl: string;
  customer: { name: string; email: string; phone?: string };
}

export async function createCharge(
  input: CreateChargeInput
): Promise<BictorysCheckoutLink> {
  const phoneDigits = input.customer.phone?.replace(/\D/g, "");

  const response = await fetch(`${getBaseUrl()}/pay/v1/charges`, {
    method: "POST",
    headers: {
      "X-Api-Key": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: "XOF",
      country: "SN",
      paymentReference: input.paymentReference,
      successRedirectUrl: input.successRedirectUrl,
      errorRedirectUrl: input.errorRedirectUrl,
      customerObject: {
        name: input.customer.name,
        email: input.customer.email,
        country: "SN",
        ...(phoneDigits && { phone: Number(phoneDigits) }),
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const error: BictorysError = await response.json();
    throw new Error(
      `Bictorys create_charge error ${response.status}: ${error.details ?? error.title}`
    );
  }

  return response.json() as Promise<BictorysCheckoutLink>;
}

interface TransactionStatus {
  id: string;
  status:
    | "succeeded"
    | "failed"
    | "cancelled"
    | "pending"
    | "processing"
    | "reversed"
    | "authorized";
  amount?: number;
  currency?: string;
  paymentReference?: string;
}

/** Kept for manual reconciliation — the redirect+webhook flow doesn't call this. */
export async function verifyTransaction(
  transactionId: string
): Promise<TransactionStatus> {
  const response = await fetch(
    `${getBaseUrl()}/pay/v1/transactions/${transactionId}/status`,
    {
      method: "GET",
      headers: { "X-API-Key": getPrivateKey() },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const error: BictorysError = await response.json();
    throw new Error(
      `Bictorys verify_transaction error ${response.status}: ${error.details ?? error.title}`
    );
  }

  return response.json() as Promise<TransactionStatus>;
}

export function isPaid(status: string | null | undefined): boolean {
  return status === "succeeded";
}

/**
 * Verifies a webhook request came from Bictorys. Prefers the HMAC path
 * (X-Webhook-Signature + X-Webhook-Timestamp, rejecting anything older than
 * 5 minutes); falls back to the always-present raw X-Secret-Key header.
 * Always uses timingSafeEqual — never ===/== on secrets.
 */
export function verifyWebhookSignature(headers: Headers, rawBody: string): boolean {
  const secret = getWebhookSecret();
  const signature = headers.get("x-webhook-signature");
  const timestamp = headers.get("x-webhook-timestamp");

  if (signature && timestamp) {
    if (Math.abs(Date.now() - Number(timestamp)) > 300_000) return false;
    const expected = createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");
    const expectedBuf = Buffer.from(expected);
    const receivedBuf = Buffer.from(signature);
    return (
      expectedBuf.length === receivedBuf.length &&
      timingSafeEqual(expectedBuf, receivedBuf)
    );
  }

  const secretHeader = headers.get("x-secret-key");
  if (!secretHeader) return false;
  const expectedBuf = Buffer.from(secret);
  const receivedBuf = Buffer.from(secretHeader);
  return (
    expectedBuf.length === receivedBuf.length &&
    timingSafeEqual(expectedBuf, receivedBuf)
  );
}

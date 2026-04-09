/**
 * Paycard API integration — Guinea (GNF)
 * Spec: afrotools/afrotools/specs/payment/paycard/ (status: verified)
 *
 * create_payment  → POST /epay/create/             (API key in body field `c`)
 * verify_payment  → GET  /epay/{c}/{ref}/status    (API key + ref in URL path)
 *
 * Critical:
 * - No sandbox. Every request hits production.
 * - verify: code === 0 means transaction found, NOT paid.
 *   Always use isPaid(result.status) before fulfilling an order.
 * - paycard-redirect-with-get: 'on' → browser GET redirect (no webhook POST).
 */

import type {
  PaycardCreateResponse,
  PaycardVerifyResponse,
  PaycardError,
} from "@/types";

function getApiKey(): string {
  const key = process.env.PAYCARD_API_KEY;
  if (!key) throw new Error("Missing env: PAYCARD_API_KEY");
  return key;
}

interface CreatePaymentInput {
  amount: number;
  description?: string;
  reference?: string;
  callbackUrl?: string;
  autoRedirect?: boolean;
  redirectWithGet?: boolean;
}

export async function createPayment(
  input: CreatePaymentInput
): Promise<PaycardCreateResponse> {
  const body: Record<string, string> = {
    c: getApiKey(),
    "paycard-amount": String(input.amount),
  };

  if (input.description) body["paycard-description"] = input.description;
  if (input.reference) body["paycard-operation-reference"] = input.reference;
  if (input.callbackUrl) body["paycard-callback-url"] = input.callbackUrl;
  if (input.autoRedirect !== undefined)
    body["paycard-auto-redirect"] = input.autoRedirect ? "on" : "off";
  if (input.redirectWithGet !== undefined)
    body["paycard-redirect-with-get"] = input.redirectWithGet ? "on" : "off";

  const response = await fetch("https://mapaycard.com/epay/create/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Paycard HTTP ${response.status}`);
  }

  const data: PaycardCreateResponse | PaycardError = await response.json();

  if (data.code !== 0) {
    const err = data as PaycardError;
    throw new Error(`Paycard error ${err.code}: ${err.error_message}`);
  }

  return data as PaycardCreateResponse;
}

/** true only when the payment is fully confirmed (status === 'success'). */
export function isPaid(status: string | null | undefined): boolean {
  return status?.toLowerCase() === "success";
}

export async function verifyPayment(
  reference: string
): Promise<PaycardVerifyResponse> {
  const url = `https://mapaycard.com/epay/${getApiKey()}/${reference}/status`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Paycard verify HTTP ${response.status}`);
  }

  const data: PaycardVerifyResponse | PaycardError = await response.json();

  if (data.code !== 0) {
    const err = data as PaycardError;
    throw new Error(`Paycard verify error ${err.code}: ${err.error_message}`);
  }

  return data as PaycardVerifyResponse;
}

/**
 * LengoPay API integration — Guinea (GNF / XOF / USD)
 * Spec: afrotools/afrotools/specs/payment/lengopay/ (status: verified)
 *
 * create_payment  → POST /api/v1/payments
 * verify_payment  → GET  /api/v1/payments/{payId}
 *
 * Critical:
 * - No sandbox. Every request hits production.
 * - Authorization header: "Basic {license_key}" — NOT standard base64 Basic Auth.
 * - websiteid is a SEPARATE required param, distinct from the license key.
 * - Store pay_id before redirecting — it's the only key for verify_payment.
 * - Status is UPPERCASE strict: compare with status === "SUCCESS".
 */

import type {
  LengoPayCreateResponse,
  LengoPayVerifyResponse,
  LengoPayError,
} from "@/types";

function getLicenseKey(): string {
  const key = process.env.LENGOPAY_LICENSE_KEY;
  if (!key) throw new Error("Missing env: LENGOPAY_LICENSE_KEY");
  return key;
}

function getWebsiteId(): string {
  const id = process.env.LENGOPAY_WEBSITE_ID;
  if (!id) throw new Error("Missing env: LENGOPAY_WEBSITE_ID");
  return id;
}

interface CreatePaymentInput {
  amount: number;
  currency?: string;
  returnUrl?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export async function createPayment(
  input: CreatePaymentInput
): Promise<LengoPayCreateResponse> {
  const body: Record<string, unknown> = {
    websiteid: getWebsiteId(),
    amount: input.amount,
    currency: input.currency ?? "GNF",
  };

  if (input.returnUrl) body["return_url"] = input.returnUrl;
  if (input.callbackUrl) body["callback_url"] = input.callbackUrl;
  if (input.metadata) body["metadata"] = input.metadata;

  const response = await fetch("https://portal.lengopay.com/api/v1/payments", {
    method: "POST",
    headers: {
      // NOT standard base64 Basic Auth — pass the key as-is
      Authorization: `Basic ${getLicenseKey()}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await response.text();
  console.log("LengoPay create response text:", text);
  let data: LengoPayCreateResponse | LengoPayError;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `LengoPay error ${response.status}: réponse non-JSON reçue`
    );
  }

  if (!response.ok) {
    throw new Error(
      `LengoPay error ${response.status}: ${(data as LengoPayError).message ?? "Unknown error"}`
    );
  }

  return data as LengoPayCreateResponse;
}

/** true only when the payment is fully confirmed. */
export function isPaid(status: string | null | undefined): boolean {
  return status === "SUCCESS";
}

export async function verifyPayment(
  payId: string
): Promise<LengoPayVerifyResponse> {
  const response = await fetch(
    `https://portal.lengopay.com/api/v1/payments/${payId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${getLicenseKey()}`,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  const text = await response.text();
  let data: LengoPayVerifyResponse | LengoPayError;
  try {
    console.log("LengoPay verify response text:", text);
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `LengoPay verify error ${response.status}: réponse non-JSON reçue`
    );
  }

  if (!response.ok) {
    throw new Error(
      `LengoPay verify error ${response.status}: ${(data as LengoPayError).message ?? "Unknown error"}`
    );
  }

  return data as LengoPayVerifyResponse;
}

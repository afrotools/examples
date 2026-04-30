/**
 * Djomy payment gateway — Guinea (GNF)
 * Spec: afrotools/specs/payment/djomy/ (create_payment_gateway: verified)
 *
 * create_payment_gateway → POST /v1/payments/gateway
 * verify_payment         → GET  /v1/payments/{transactionId}/status
 *
 * Critical:
 * - Sandbox URL — replace DJOMY_BASE_URL for production.
 * - Auth: HMAC-SHA256(clientId, clientSecret) as hex → POST /v1/auth → Bearer token.
 * - Every request needs BOTH Authorization: Bearer {token} AND X-API-KEY: clientId:hmac.
 * - payerNumber is strictly required — collect phone number before calling.
 * - returnUrl / cancelUrl must be HTTPS (use ngrok tunnel in development).
 * - Store transactionId before redirecting — it's the only key for verify_payment.
 * - status === "SUCCESS" is the ONLY safe condition to fulfill an order.
 */

import type { DjomyCreateGatewayData, DjomyVerifyData } from "@/types";

const DJOMY_BASE_URL = "https://sandbox-api.djomy.africa";

function getClientId(): string {
  const id = process.env.DJOMY_CLIENT_ID;
  if (!id) throw new Error("Missing env: DJOMY_CLIENT_ID");
  return id;
}

function getClientSecret(): string {
  const secret = process.env.DJOMY_CLIENT_SECRET;
  if (!secret) throw new Error("Missing env: DJOMY_CLIENT_SECRET");
  return secret;
}

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

interface DjomyResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error: { code: number; message: string; details: string; fieldsErrors: string[] } | null;
  timestamp: string;
  status: number;
}

async function getAccessToken(): Promise<string> {
  const clientId = getClientId();
  const signature = await computeHmacHex(clientId, getClientSecret());

  const response = await fetch(`${DJOMY_BASE_URL}/v1/auth`, {
    method: "POST",
    headers: {
      "X-API-KEY": `${clientId}:${signature}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Djomy auth HTTP ${response.status}`);
  }

  const result = (await response.json()) as DjomyResponse<{
    accessToken: string;
    tokenType: string;
    expiresIn: number;
  }>;

  if (!result.success) {
    throw new Error(`Djomy auth error: ${result.message}`);
  }

  return result.data.accessToken;
}

interface CreatePaymentGatewayInput {
  amount: number;
  payerNumber: string;
  description?: string;
  reference?: string;
  returnUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string | number | boolean>;
}

export async function createPaymentGateway(
  input: CreatePaymentGatewayInput
): Promise<DjomyCreateGatewayData> {
  const clientId = getClientId();
  // X-API-KEY must be recomputed separately from the one used in getAccessToken
  const signature = await computeHmacHex(clientId, getClientSecret());
  const accessToken = await getAccessToken();
  console.debug("[djomy] createPaymentGateway signature:", signature);

  const response = await fetch(`${DJOMY_BASE_URL}/v1/payments/gateway`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-API-KEY": `${clientId}:${signature}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amount,
      countryCode: "GN",
      payerNumber: input.payerNumber,
      ...(input.description && { description: input.description }),
      ...(input.reference && { merchantPaymentReference: input.reference }),
      ...(input.returnUrl && { returnUrl: input.returnUrl }),
      ...(input.cancelUrl && { cancelUrl: input.cancelUrl }),
      ...(input.metadata && { metadata: input.metadata }),
    }),
    cache: "no-store",
  });

  const result = (await response.json()) as DjomyResponse<DjomyCreateGatewayData>;

  if (!result.success) {
    throw new Error(
      `Djomy create_payment_gateway error: ${result.error?.message ?? result.message}`
    );
  }

  return result.data;
}

/** true only when payment is fully confirmed (status === "SUCCESS"). */
export function isPaid(status: string | null | undefined): boolean {
  return status === "SUCCESS";
}

export async function verifyPayment(
  transactionId: string
): Promise<DjomyVerifyData> {
  const clientId = getClientId();
  const signature = await computeHmacHex(clientId, getClientSecret());
  const accessToken = await getAccessToken();
  console.debug("[djomy] verifyPayment signature:", signature);

  const response = await fetch(
    `${DJOMY_BASE_URL}/v1/payments/${transactionId}/status`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-API-KEY": `${clientId}:${signature}`,
      },
      cache: "no-store",
    }
  );

  const result = (await response.json()) as DjomyResponse<DjomyVerifyData>;

  if (!result.success) {
    throw new Error(
      `Djomy verify_payment error: ${result.error?.message ?? result.message}`
    );
  }

  return result.data;
}

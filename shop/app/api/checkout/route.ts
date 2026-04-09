import { NextRequest, NextResponse } from "next/server";
import { createPayment } from "@/lib/paycard";
import { PRODUCTS } from "@/lib/products";
import type { CreatePaymentRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentRequest = await request.json();
    const { items, customer } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Panier vide." }, { status: 400 });
    }
    if (!customer?.name?.trim() || !customer?.email?.trim()) {
      return NextResponse.json(
        { error: "Informations client manquantes." },
        { status: 400 }
      );
    }

    // Re-price server-side from canonical catalog — never trust client prices
    let totalAmount = 0;
    const lineItems: string[] = [];

    for (const item of items) {
      const canonical = PRODUCTS.find((p) => p.id === item.product.id);
      if (!canonical) {
        return NextResponse.json(
          { error: `Produit inconnu : ${item.product.id}` },
          { status: 400 }
        );
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json(
          { error: `Quantité invalide pour ${canonical.name}` },
          { status: 400 }
        );
      }
      totalAmount += canonical.price * item.quantity;
      lineItems.push(`${canonical.name} ×${item.quantity}`);
    }

    const description = `${customer.name} — ${lineItems.join(", ")}`.slice(
      0,
      255
    );

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

    // paycard-redirect-with-get: 'on' → Paycard redirects the browser to
    // callbackUrl with ?paycard-operation-reference=XXX (GET). No server-to-server POST is sent.
    // The success page receives the ref and verifies server-side.
    const payment = await createPayment({
      amount: Math.round(totalAmount),
      description,
      callbackUrl: `${baseUrl}/payment/success`,
      autoRedirect: true,
      redirectWithGet: true,
    });

    // In production: persist payment["paycard-operation-reference"] + order to DB
    // before returning — it's the only key for server-side verification later.

    return NextResponse.json({
      paymentUrl: payment.payment_url,
      operationReference: payment.operation_reference,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur interne du serveur.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

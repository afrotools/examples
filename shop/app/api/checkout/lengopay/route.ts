import { NextRequest, NextResponse } from "next/server";
import { createPayment } from "@/lib/lengopay";
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

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

    const payment = await createPayment({
      amount: Math.round(totalAmount),
      // return_url is set without pay_id — client stores pay_id in sessionStorage
      // before redirecting so the success page can verify server-side.
      returnUrl: `${baseUrl}/payment/lengopay`,
      callbackUrl: `${baseUrl}/api/webhooks/lengopay`,
      metadata: {
        customer: customer.email,
        items: lineItems.join(", "),
      },
    });

    // In production: persist pay_id + order to DB before returning.
    // pay_id is the only key for server-side verification later.

    return NextResponse.json({
      paymentUrl: payment.payment_url,
      // Returned so the client can store it in sessionStorage before redirecting.
      payId: payment.pay_id,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur interne du serveur.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

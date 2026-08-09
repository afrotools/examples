import { NextRequest, NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/products";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { CreateOrderRequest } from "@/types";

function generateOrderReference(): string {
  return `SN-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
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

    // Re-price server-side from the canonical products table — never trust
    // client-submitted prices.
    const canonicalProducts = await getProductsByIds(
      items.map((item) => item.product.id)
    );

    let amountTotal = 0;
    const orderItems: Array<{
      productId: string;
      name: string;
      unitPrice: number;
      quantity: number;
    }> = [];

    for (const item of items) {
      const canonical = canonicalProducts.find((p) => p.id === item.product.id);
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
      amountTotal += canonical.price * item.quantity;
      orderItems.push({
        productId: canonical.id,
        name: canonical.name,
        unitPrice: canonical.price,
        quantity: item.quantity,
      });
    }

    const orderReference = generateOrderReference();

    const { error } = await supabaseAdmin.from("payments").insert({
      order_reference: orderReference,
      status: "pending",
      currency: "XOF",
      amount_total: Math.round(amountTotal),
      items: orderItems,
      customer_name: customer.name.trim(),
      customer_email: customer.email.trim(),
      customer_phone: customer.phone?.trim() || null,
    });

    if (error) {
      throw new Error(`Supabase insert payments error: ${error.message}`);
    }

    return NextResponse.json({ orderReference });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur interne du serveur.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

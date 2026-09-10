import { getProductsByIds } from "@/lib/products";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { CartItem, CheckoutFormData } from "@/types";

/** Thrown for client-input problems — callers should map this to HTTP 400. */
export class OrderValidationError extends Error {}

export function generateOrderReference(): string {
  return `SN-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Re-prices the cart server-side from the canonical products table (never
 * trust client-submitted prices) and inserts a `pending` row into
 * Supabase `payments`. Shared by /api/orders and /api/checkout/bictorys so
 * every payment provider starts from the same validated order record.
 */
export async function createPendingOrder(
  items: CartItem[],
  customer: CheckoutFormData
): Promise<{ orderReference: string; amountTotal: number }> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new OrderValidationError("Panier vide.");
  }
  if (!customer?.name?.trim() || !customer?.email?.trim()) {
    throw new OrderValidationError("Informations client manquantes.");
  }

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
      throw new OrderValidationError(`Produit inconnu : ${item.product.id}`);
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new OrderValidationError(`Quantité invalide pour ${canonical.name}`);
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
  const roundedTotal = Math.round(amountTotal);

  const { error } = await supabaseAdmin.from("payments").insert({
    order_reference: orderReference,
    status: "pending",
    currency: "XOF",
    amount_total: roundedTotal,
    items: orderItems,
    customer_name: customer.name.trim(),
    customer_email: customer.email.trim(),
    customer_phone: customer.phone?.trim() || null,
  });

  if (error) {
    throw new Error(`Supabase insert payments error: ${error.message}`);
  }

  return { orderReference, amountTotal: roundedTotal };
}

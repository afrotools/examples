import { NextRequest, NextResponse } from "next/server";
import { createPendingOrder, OrderValidationError } from "@/lib/orders";
import { createCheckoutSession } from "@/lib/saspay";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { CreateOrderRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    const { orderReference, amountTotal } = await createPendingOrder(
      body.items,
      body.customer
    );

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const session = await createCheckoutSession({
      amount: amountTotal,
      orderReference,
      returnUrl: `${baseUrl}/checkout/confirmation?ref=${orderReference}`,
      customer: body.customer,
    });

    // The session id is what get_checkout_session_status takes; the webhook
    // handler uses it to confirm the payment.
    const { error } = await supabaseAdmin
      .from("payments")
      .update({ provider: "saspay", provider_transaction_id: session.id })
      .eq("order_reference", orderReference);
    if (error) throw new Error(`Supabase update payments error: ${error.message}`);

    return NextResponse.json({ paymentUrl: session.checkout_url, orderReference });
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Erreur interne du serveur.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

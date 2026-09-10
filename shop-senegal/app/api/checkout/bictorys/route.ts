import { NextRequest, NextResponse } from "next/server";
import { createPendingOrder, OrderValidationError } from "@/lib/orders";
import { createCharge } from "@/lib/bictorys";
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
    const resultUrl = `${baseUrl}/checkout/confirmation?ref=${orderReference}`;

    const charge = await createCharge({
      amount: amountTotal,
      paymentReference: orderReference,
      successRedirectUrl: resultUrl,
      errorRedirectUrl: resultUrl,
      customer: {
        name: body.customer.name,
        email: body.customer.email,
        phone: body.customer.phone,
      },
    });

    const { error } = await supabaseAdmin
      .from("payments")
      .update({ provider: "bictorys", provider_transaction_id: charge.chargeId })
      .eq("order_reference", orderReference);

    if (error) {
      throw new Error(`Supabase update payments error: ${error.message}`);
    }

    return NextResponse.json({ paymentUrl: charge.link, orderReference });
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message =
      err instanceof Error ? err.message : "Erreur interne du serveur.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

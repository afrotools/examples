import { NextRequest, NextResponse } from "next/server";
import { createPendingOrder, OrderValidationError } from "@/lib/orders";
import type { CreateOrderRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    const { orderReference } = await createPendingOrder(body.items, body.customer);
    return NextResponse.json({ orderReference });
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message =
      err instanceof Error ? err.message : "Erreur interne du serveur.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { verifyPayment, isPaid } from "@/lib/djomy";

export async function GET(request: NextRequest) {
  const transactionId = request.nextUrl.searchParams.get("transaction_id");

  if (!transactionId) {
    return NextResponse.json(
      { error: "Paramètre transaction_id manquant." },
      { status: 400 }
    );
  }

  try {
    const result = await verifyPayment(transactionId);
    return NextResponse.json({
      paid: isPaid(result.status),
      status: result.status,
      amount: result.paidAmount,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Vérification échouée.";
    return NextResponse.json({ paid: false, error: message });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { verifyPayment, isPaid } from "@/lib/paycard";

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");

  if (!ref) {
    return NextResponse.json(
      { error: "Paramètre ref manquant." },
      { status: 400 }
    );
  }

  try {
    const status = await verifyPayment(ref);
    return NextResponse.json({
      paid: isPaid(status.status),
      transactionDate: status.transaction_date,
      paymentMethod: status.payment_method,
      amount: status.payment_amount,
      formattedAmount: status.payment_amount_formatted,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Vérification échouée.";
    return NextResponse.json({ paid: false, error: message });
  }
}

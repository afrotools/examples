import { NextRequest, NextResponse } from "next/server";
import { verifyPayment, isPaid } from "@/lib/lengopay";

export async function GET(request: NextRequest) {
  const payId = request.nextUrl.searchParams.get("pay_id");
  console.log("Received verify request for pay_id:", payId);

  if (!payId) {
    return NextResponse.json(
      { error: "Paramètre pay_id manquant." },
      { status: 400 }
    );
  }

  try {
    const result = await verifyPayment(payId);
    return NextResponse.json({
      paid: isPaid(result.status),
      status: result.status,
      amount: result.amount,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Vérification échouée.";
    return NextResponse.json({ paid: false, error: message });
  }
}

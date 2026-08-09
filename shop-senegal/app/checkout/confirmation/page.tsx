import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatXOF } from "@/lib/utils";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Payment, PaymentStatus } from "@/types";

interface PaymentRow {
  id: string;
  order_reference: string;
  status: PaymentStatus;
  currency: string;
  amount_total: number;
  items: Payment["items"];
  customer_name: string;
  customer_email: string;
  created_at: string;
}

async function getPaymentByReference(ref: string): Promise<Payment | null> {
  const { data, error } = await supabaseAdmin
    .from("payments")
    .select(
      "id, order_reference, status, currency, amount_total, items, customer_name, customer_email, created_at"
    )
    .eq("order_reference", ref)
    .maybeSingle<PaymentRow>();

  if (error) throw new Error(`Supabase getPaymentByReference error: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    orderReference: data.order_reference,
    status: data.status,
    currency: data.currency,
    amountTotal: data.amount_total,
    items: data.items,
    customerName: data.customer_name,
    customerEmail: data.customer_email,
    customerPhone: null,
    provider: null,
    providerTransactionId: null,
    createdAt: data.created_at,
    updatedAt: data.created_at,
  };
}

const STATUS_META: Record<
  PaymentStatus,
  { icon: typeof Clock; label: string; color: string }
> = {
  pending: { icon: Clock, label: "En attente de paiement", color: "text-yellow-500" },
  succeeded: { icon: CheckCircle2, label: "Payée", color: "text-green-500" },
  failed: { icon: XCircle, label: "Échec du paiement", color: "text-destructive" },
  cancelled: { icon: XCircle, label: "Commande annulée", color: "text-destructive" },
};

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  if (!ref) notFound();

  const payment = await getPaymentByReference(ref);
  if (!payment) notFound();

  const { icon: StatusIcon, label, color } = STATUS_META[payment.status];

  return (
    <div className="container mx-auto px-4 py-20">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center space-y-3 pb-4">
          <StatusIcon className={`mx-auto h-14 w-14 ${color}`} />
          <CardTitle className="text-xl">Commande créée</CardTitle>
          <p className="text-sm text-muted-foreground">{label}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Référence</dt>
              <dd className="font-mono text-xs truncate max-w-[180px]">
                {payment.orderReference}
              </dd>
            </div>
            {payment.items.map((item) => (
              <div key={item.productId} className="flex justify-between gap-2">
                <dt className="text-muted-foreground min-w-0 truncate">
                  {item.name} <span className="text-foreground">×{item.quantity}</span>
                </dt>
                <dd className="shrink-0 font-medium">
                  {formatXOF(item.unitPrice * item.quantity)}
                </dd>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-semibold">
              <dt>Total</dt>
              <dd>{formatXOF(payment.amountTotal)}</dd>
            </div>
          </dl>
          <Separator />
          <div className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            Le paiement en ligne sera disponible prochainement — cette
            commande reste en attente jusque-là.
          </div>
          <Button asChild className="w-full">
            <Link href="/">Retour à la boutique</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

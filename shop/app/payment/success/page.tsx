import { Suspense } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { verifyPayment, isPaid } from "@/lib/paycard";
import Link from "next/link";

// Next.js 16: searchParams is a Promise
// Paycard appends ?paycard-operation-reference= in redirect-with-get mode
interface SuccessPageProps {
  searchParams: Promise<{
    ref?: string;
    "paycard-operation-reference"?: string;
  }>;
}

// "ref" is a reserved React prop — use "operationRef" instead
async function VerificationResult({
  operationRef,
}: {
  operationRef: string;
}) {
  let paid = false;
  let transactionDate = "";
  let paymentMethod = "";
  let formattedAmount = "";
  let errorMessage = "";

  try {
    const status = await verifyPayment(operationRef);
    paid = isPaid(status.status);
    transactionDate = status.transaction_date ?? "";
    paymentMethod = status.payment_method ?? "";
    formattedAmount = status.payment_amount_formatted;
  } catch (err) {
    errorMessage =
      err instanceof Error ? err.message : "Vérification impossible.";
  }

  if (paid) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center space-y-3 pb-4">
          <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
          <CardTitle className="text-xl">Paiement confirmé !</CardTitle>
          <p className="text-sm text-muted-foreground">
            Merci pour votre commande. Votre paiement a été reçu avec succès.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Montant</dt>
              <dd className="font-semibold">{formattedAmount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Méthode</dt>
              <dd>{paymentMethod}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Date</dt>
              <dd>{transactionDate}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Référence</dt>
              <dd className="font-mono text-xs">{operationRef}</dd>
            </div>
          </dl>
          <Separator />
          <Button asChild className="w-full">
            <Link href="/">Retour à la boutique</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center space-y-3 pb-4">
        <XCircle className="mx-auto h-14 w-14 text-destructive" />
        <CardTitle className="text-xl">Paiement non confirmé</CardTitle>
        <p className="text-sm text-muted-foreground">
          {errorMessage ||
            "Le paiement n'a pas pu être vérifié. Contactez le support si vous avez été débité."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground text-center font-mono">
          Réf : {operationRef}
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/">Retour à la boutique</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  // Paycard sends ?paycard-operation-reference= in redirect-with-get mode
  const operationRef =
    params["paycard-operation-reference"] ?? params.ref;

  if (!operationRef) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-muted-foreground">
          Référence de paiement manquante.
        </p>
        <Button asChild>
          <Link href="/">Retour à la boutique</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <Suspense
        fallback={
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <VerificationResult operationRef={operationRef} />
      </Suspense>
    </div>
  );
}

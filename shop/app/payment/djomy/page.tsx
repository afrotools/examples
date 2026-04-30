"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatGNF } from "@/lib/utils";
import Link from "next/link";

interface VerifyResult {
  paid: boolean;
  status?: string;
  amount?: number;
  error?: string;
}

export default function DjomyResultPage() {
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  useEffect(() => {
    const storedId = sessionStorage.getItem("djomy_transaction_id");
    if (!storedId) {
      setResult({ paid: false, error: "Référence de paiement introuvable." });
      return;
    }

    setTransactionId(storedId);

    fetch(`/api/payment/djomy/verify?transaction_id=${storedId}`)
      .then((res) => res.json())
      .then((data: VerifyResult) => {
        setResult(data);
        // Clean up only on SUCCESS — keep for retry on PENDING
        if (data.paid) {
          sessionStorage.removeItem("djomy_transaction_id");
        }
      })
      .catch(() => {
        setResult({ paid: false, error: "Impossible de vérifier le paiement." });
      });
  }, []);

  if (!result) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (result.paid) {
    return (
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center space-y-3 pb-4">
            <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
            <CardTitle className="text-xl">Paiement confirmé !</CardTitle>
            <p className="text-sm text-muted-foreground">
              Merci pour votre commande. Votre paiement Djomy a été reçu avec
              succès.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <dl className="space-y-2 text-sm">
              {result.amount !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Montant</dt>
                  <dd className="font-semibold">{formatGNF(result.amount)}</dd>
                </div>
              )}
              {transactionId && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Référence</dt>
                  <dd className="font-mono text-xs truncate max-w-[180px]">
                    {transactionId}
                  </dd>
                </div>
              )}
            </dl>
            <Separator />
            <Button asChild className="w-full">
              <Link href="/">Retour à la boutique</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // PENDING — payment still processing
  if (result.status === "PENDING" || result.status === "REDIRECTED") {
    return (
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center space-y-3 pb-4">
            <Clock className="mx-auto h-14 w-14 text-yellow-500" />
            <CardTitle className="text-xl">Paiement en cours…</CardTitle>
            <p className="text-sm text-muted-foreground">
              Votre paiement est en cours de traitement. Revenez dans quelques
              instants.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactionId && (
              <p className="text-xs text-muted-foreground text-center font-mono">
                Réf : {transactionId}
              </p>
            )}
            <Button
              className="w-full"
              onClick={() => window.location.reload()}
            >
              Vérifier à nouveau
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Retour à la boutique</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // FAILED / CANCELLED / TIMEOUT / error
  return (
    <div className="container mx-auto px-4 py-20">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center space-y-3 pb-4">
          <XCircle className="mx-auto h-14 w-14 text-destructive" />
          <CardTitle className="text-xl">Paiement non confirmé</CardTitle>
          <p className="text-sm text-muted-foreground">
            {result.error ||
              "Le paiement n'a pas pu être vérifié. Contactez le support si vous avez été débité."}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {transactionId && (
            <p className="text-xs text-muted-foreground text-center font-mono">
              Réf : {transactionId}
            </p>
          )}
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Retour à la boutique</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

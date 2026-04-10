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
  currency?: string;
  message?: string;
  error?: string;
}

export default function LengoPayResultPage() {
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [payId, setPayId] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve pay_id stored in sessionStorage by the checkout page before redirect
    const storedPayId = sessionStorage.getItem("lengopay_pay_id");
    if (!storedPayId) {
      setResult({ paid: false, error: "Référence de paiement introuvable." });
      return;
    }

    setPayId(storedPayId);

    fetch(`/api/payment/lengopay/verify?pay_id=${storedPayId}`)
      .then((res) => res.json())
      .then((data: VerifyResult) => {
        setResult(data);
        // Clean up only on SUCCESS — keep for retry on PENDING/FAILED
        if (data.paid) {
          sessionStorage.removeItem("lengopay_pay_id");
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
              Merci pour votre commande. Votre paiement LengoPay a été reçu avec succès.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <dl className="space-y-2 text-sm">
              {result.amount !== undefined && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Montant</dt>
                  <dd className="font-semibold">
                    {result.currency === "GNF"
                      ? formatGNF(result.amount)
                      : `${result.amount} ${result.currency}`}
                  </dd>
                </div>
              )}
              {payId && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Référence</dt>
                  <dd className="font-mono text-xs truncate max-w-[180px]">{payId}</dd>
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
  if (result.status === "PENDING") {
    return (
      <div className="container mx-auto px-4 py-20">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center space-y-3 pb-4">
            <Clock className="mx-auto h-14 w-14 text-yellow-500" />
            <CardTitle className="text-xl">Paiement en cours…</CardTitle>
            <p className="text-sm text-muted-foreground">
              Votre paiement est en cours de traitement. Revenez dans quelques instants.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {payId && (
              <p className="text-xs text-muted-foreground text-center font-mono">
                Réf : {payId}
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

  // FAILED / CANCELLED / error
  return (
    <div className="container mx-auto px-4 py-20">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center space-y-3 pb-4">
          <XCircle className="mx-auto h-14 w-14 text-destructive" />
          <CardTitle className="text-xl">Paiement non confirmé</CardTitle>
          <p className="text-sm text-muted-foreground">
            {result.error ||
              result.message ||
              "Le paiement n'a pas pu être vérifié. Contactez le support si vous avez été débité."}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {payId && (
            <p className="text-xs text-muted-foreground text-center font-mono">
              Réf : {payId}
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

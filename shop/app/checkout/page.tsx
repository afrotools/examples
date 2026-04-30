"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatGNF } from "@/lib/utils";
import { Loader2, ShieldCheck } from "lucide-react";
import type { CheckoutFormData } from "@/types";

type PaymentProvider = "paycard" | "lengopay" | "djomy";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart, hydrated } = useCart();
  const [form, setForm] = useState<CheckoutFormData>({ name: "", email: "" });
  const [loading, setLoading] = useState<PaymentProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect after hydration if cart is empty (must be in useEffect, not render)
  useEffect(() => {
    if (hydrated && items.length === 0) {
      router.replace("/");
    }
  }, [hydrated, items.length, router]);

  if (!hydrated || (hydrated && items.length === 0)) return null;

  async function handlePayment(provider: PaymentProvider) {
    setLoading(provider);
    setError(null);

    const endpoint =
      provider === "lengopay"
        ? "/api/checkout/lengopay"
        : provider === "djomy"
          ? "/api/checkout/djomy"
          : "/api/checkout";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, customer: form }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          (data as { error?: string }).error ??
            "Erreur lors de la création du paiement."
        );
      }

      clearCart();

      if (provider === "lengopay") {
        // Store pay_id in sessionStorage before redirect — the success page
        // reads it to call verify_payment server-side after LengoPay returns.
        const { paymentUrl, payId } = data as {
          paymentUrl: string;
          payId: string;
        };
        sessionStorage.setItem("lengopay_pay_id", payId);
        window.location.href = paymentUrl;
      } else if (provider === "djomy") {
        // Store transactionId before redirect — the result page uses it to
        // call verify_payment server-side after returning from Djomy portal.
        const { paymentUrl, transactionId } = data as {
          paymentUrl: string;
          transactionId: string;
        };
        sessionStorage.setItem("djomy_transaction_id", transactionId);
        window.location.href = paymentUrl;
      } else {
        window.location.href = (data as { paymentUrl: string }).paymentUrl;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Une erreur est survenue."
      );
      setLoading(null);
    }
  }

  const isLoading = loading !== null;

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Finaliser la commande
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Choisissez votre moyen de paiement pour continuer.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vos informations</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  required
                  minLength={2}
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Mamadou Diallo"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="mamadou@email.com"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Téléphone{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (requis pour Djomy)
                  </span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="00224623000000"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <Button
                  type="button"
                  className="w-full gap-2"
                  disabled={isLoading || !form.name.trim() || !form.email.trim()}
                  onClick={() => handlePayment("paycard")}
                >
                  {loading === "paycard" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirection vers Paycard…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Payer avec Paycard
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  disabled={isLoading || !form.name.trim() || !form.email.trim()}
                  onClick={() => handlePayment("lengopay")}
                >
                  {loading === "lengopay" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirection vers LengoPay…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Payer avec LengoPay
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  disabled={
                    isLoading ||
                    !form.name.trim() ||
                    !form.email.trim() ||
                    !form.phone?.trim()
                  }
                  onClick={() => handlePayment("djomy")}
                >
                  {loading === "djomy" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirection vers Djomy…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      Payer avec Djomy
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Paiement sécurisé — Orange Money, MTN MoMo, carte bancaire
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Order summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Résumé de commande</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex justify-between text-sm gap-2"
              >
                <span className="text-muted-foreground min-w-0 truncate">
                  {product.name}{" "}
                  <span className="font-medium text-foreground">
                    ×{quantity}
                  </span>
                </span>
                <span className="shrink-0 font-medium">
                  {formatGNF(product.price * quantity)}
                </span>
              </div>
            ))}

            <Separator className="my-2" />

            <div className="flex justify-between items-center font-semibold">
              <span>Total</span>
              <span className="text-lg">{formatGNF(totalPrice)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

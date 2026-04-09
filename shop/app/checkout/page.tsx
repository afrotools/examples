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

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart, hydrated } = useCart();
  const [form, setForm] = useState<CheckoutFormData>({ name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect after hydration if cart is empty (must be in useEffect, not render)
  useEffect(() => {
    if (hydrated && items.length === 0) {
      router.replace("/");
    }
  }, [hydrated, items.length, router]);

  if (!hydrated || (hydrated && items.length === 0)) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
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

      // Clear cart before leaving — user is going to Paycard
      clearCart();

      // Hard redirect to Paycard hosted payment page
      window.location.href = (data as { paymentUrl: string }).paymentUrl;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Une erreur est survenue."
      );
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Finaliser la commande
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Vous serez redirigé vers Paycard pour le paiement sécurisé.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vos informations</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? (
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

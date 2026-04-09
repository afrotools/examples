"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatGNF } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

interface CartSheetProps {
  children: ReactNode;
}

export function CartSheet({ children }: CartSheetProps) {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } =
    useCart();

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="flex flex-col w-full sm:max-w-md p-0"
      >
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle>Panier ({totalItems})</SheetTitle>
          <SheetDescription className="sr-only">
            Contenu de votre panier
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <span className="text-5xl" aria-hidden>
                🛒
              </span>
              <p className="text-muted-foreground text-sm">
                Votre panier est vide.
              </p>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex gap-4 items-center py-3 border-b border-border last:border-0"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-medium text-sm leading-snug truncate">
                    {product.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatGNF(product.price)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeItem(product.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-border space-y-4">
            <Separator />
            <div className="flex justify-between items-center text-base font-semibold">
              <span>Total</span>
              <span>{formatGNF(totalPrice)}</span>
            </div>
            {/* SheetClose closes the drawer before navigating */}
            <SheetClose asChild>
              <Button asChild className="w-full">
                <Link href="/checkout">Passer la commande →</Link>
              </Button>
            </SheetClose>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

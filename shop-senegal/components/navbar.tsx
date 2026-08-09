"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartSheet } from "@/components/cart-sheet";
import { useCart } from "@/components/cart-provider";

export function Navbar() {
  const { totalItems, hydrated } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
        >
          Afrotools Shop Sénégal
        </Link>

        <CartSheet>
          <Button variant="outline" size="icon" className="relative">
            <ShoppingBag className="h-5 w-5" />
            {hydrated && totalItems > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                {totalItems > 9 ? "9+" : totalItems}
              </Badge>
            )}
            <span className="sr-only">Panier ({totalItems} articles)</span>
          </Button>
        </CartSheet>
      </div>
    </header>
  );
}

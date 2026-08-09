"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { formatXOF } from "@/lib/utils";
import type { Product } from "@/types";

const CATEGORY_ICONS: Record<string, string> = {
  Vêtements: "👘",
  Musique: "🥁",
  "Art de Vivre": "🍵",
  Accessoires: "👜",
  Décoration: "🎨",
};

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Decorative product illustration */}
      <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
        <span className="text-8xl select-none" aria-hidden>
          {CATEGORY_ICONS[product.category] ?? "🛍️"}
        </span>
        <Badge className="absolute top-3 left-3">{product.category}</Badge>
      </div>

      <CardContent className="flex-1 p-5 space-y-2">
        <h2 className="font-semibold text-base leading-snug">{product.name}</h2>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {product.description}
        </p>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex items-center justify-between gap-3">
        <span className="text-lg font-bold">{formatXOF(product.price)}</span>
        <Button size="sm" onClick={() => addItem(product)} className="gap-2">
          <ShoppingCart className="h-4 w-4" />
          Ajouter
        </Button>
      </CardFooter>
    </Card>
  );
}

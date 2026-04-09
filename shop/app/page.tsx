import { PRODUCTS } from "@/lib/products";
import { ProductCard } from "@/components/product-card";

export default function ShopPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-10 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          Artisanat Guinéen
        </h1>
        <p className="text-muted-foreground max-w-xl">
          Découvrez nos produits artisanaux authentiques de Guinée. Chaque
          article est fabriqué à la main par des artisans locaux. Paiement
          sécurisé via Paycard.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <p className="mt-12 text-center text-xs text-muted-foreground">
        Paiement sécurisé via{" "}
        <span className="font-medium">Paycard</span> — Orange Money, MTN
        MoMo, carte bancaire
      </p>
    </div>
  );
}

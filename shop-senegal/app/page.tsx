import { getAllProducts } from "@/lib/products";
import { ProductCard } from "@/components/product-card";

export default async function ShopPage() {
  const products = await getAllProducts();

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-10 space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          Artisanat Sénégalais
        </h1>
        <p className="text-muted-foreground max-w-xl">
          Découvrez nos produits artisanaux authentiques du Sénégal. Chaque
          article est fabriqué à la main par des artisans locaux.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

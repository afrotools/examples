import { ProductCardSkeleton } from "@/components/product-card-skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-10 space-y-3">
        <div className="h-8 w-48 bg-muted rounded-md animate-pulse" />
        <div className="h-4 w-80 bg-muted rounded-md animate-pulse" />
      </div>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center gap-6 text-center">
      <p className="text-7xl font-bold text-muted-foreground/30">404</p>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Page introuvable</h2>
        <p className="text-muted-foreground text-sm">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Retour à la boutique</Link>
      </Button>
    </div>
  );
}

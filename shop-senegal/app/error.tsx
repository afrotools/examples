"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center gap-6 text-center">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Une erreur est survenue</h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          {error.message ?? "Veuillez réessayer ou contacter le support."}
        </p>
      </div>
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}

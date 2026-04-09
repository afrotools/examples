import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function FailedPage() {
  return (
    <div className="container mx-auto px-4 py-20">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center space-y-3 pb-4">
          <XCircle className="mx-auto h-14 w-14 text-destructive" />
          <CardTitle className="text-xl">Paiement annulé</CardTitle>
          <p className="text-sm text-muted-foreground">
            Votre paiement a été annulé ou a échoué. Votre panier a été
            conservé.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/checkout">Réessayer</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Retour à la boutique</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

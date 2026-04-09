import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-provider";
import { Navbar } from "@/components/navbar";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Afrotools Shop — Artisanat Guinéen",
    template: "%s | Afrotools Shop",
  },
  description:
    "Boutique de produits artisanaux guinéens authentiques. Paiement sécurisé via Paycard — Orange Money, MTN MoMo, carte bancaire.",
  openGraph: {
    type: "website",
    locale: "fr_GN",
    siteName: "Afrotools Shop",
  },
  robots: {
    index: false, // demo app — do not index
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <CartProvider>
          <Navbar />
          <main className="pb-16">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}

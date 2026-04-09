import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format an integer GNF amount as a human-readable string.
 * e.g. 185000 → "185 000 GNF"
 */
export function formatGNF(amount: number): string {
  return (
    new Intl.NumberFormat("fr-GN", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(amount) + " GNF"
  );
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format an integer XOF amount as a human-readable string.
 * e.g. 75000 → "75 000 XOF"
 */
export function formatXOF(amount: number): string {
  return (
    new Intl.NumberFormat("fr-SN", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(amount) + " XOF"
  );
}

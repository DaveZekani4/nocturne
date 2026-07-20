import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats an amount stored in kobo (integer) as a Naira string.
 * e.g. formatNaira(200000) -> "₦2,000"
 */
export function formatNaira(amountInKobo: number): string {
  const naira = amountInKobo / 100;
  return `₦${naira.toLocaleString("en-NG")}`;
}

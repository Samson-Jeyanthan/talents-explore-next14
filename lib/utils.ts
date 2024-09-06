import { type ClassValue, clsx } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getLinkCopied(url: string) {
  navigator.clipboard
    .writeText(url)
    .then(() => {
      toast.success("Link copied to clipboard", { duration: 4000 });
    })
    .catch(() => {
      toast.error("Failed to copy link", { duration: 4000 });
    });
}

export function getFormattedDate(date: string | null): string {
  if (!date) {
    return "";
  }

  const dt = new Date(date);

  if (isNaN(dt.getTime())) {
    throw new Error("Invalid date format");
  }

  const year = dt.getUTCFullYear();
  const month = (dt.getUTCMonth() + 1).toString().padStart(2, "0"); // Months are 0-based, hence adding 1
  const day = dt.getUTCDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getFormattedDecimal(num: number): string {
  return Math.floor(num) === 0 ? "N/A" : num.toFixed(1);
}

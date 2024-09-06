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

// getting date format like 2024 Jan 01
export function getFormattedDate(date: string | null): string {
  if (!date) {
    return "";
  }
  const dt = new Date(date);

  if (isNaN(dt.getTime())) {
    throw new Error("Invalid date format");
  }

  const year = dt.getUTCFullYear();
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[dt.getUTCMonth()]; // Get the month name from the array
  const day = dt.getUTCDate().toString().padStart(2, "0");

  return `${year} ${month} ${day}`;
}

// formatting decimal number 4.3333 -> 4.3
export function getFormattedDecimal(num: number): string {
  return Math.floor(num) === 0 ? "N/A" : num.toFixed(1);
}

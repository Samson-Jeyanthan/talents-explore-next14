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

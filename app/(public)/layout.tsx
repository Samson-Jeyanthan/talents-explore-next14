import PublicSiteShell from "@/components/legal/PublicSiteShell";
import type { ReactNode } from "react";
import "@/styles/legal.css";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <PublicSiteShell>{children}</PublicSiteShell>;
}

import Link from "next/link";
import { PUBLIC_SITE_LINKS } from "@/lib/legal-links";

const SHORT_LABELS: Record<string, string> = {
  "/terms-and-conditions": "Terms",
  "/privacy-policy": "Privacy",
  "/community-guidelines": "Community",
  "/intellectual-property-policy": "Intellectual Property",
  "/cookies-policy": "Cookies",
  "/branded-content-policy": "Branded Content",
  "/child-safety-standards": "Child Safety",
  "/delete-account": "Delete Account",
};

export default function PolicyLinks() {
  return (
    <nav
      aria-label="Platform policies"
      className="mt-6 flex w-full flex-wrap justify-center gap-x-4 gap-y-2 text-center text-xs text-light-600"
    >
      {PUBLIC_SITE_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.title}
          title={link.title}
          className="hover:text-light-900 hover:underline"
        >
          <span className="auth-policy-full">{link.title}</span>
          <span className="auth-policy-short hidden" aria-hidden="true">
            {SHORT_LABELS[link.href]}
          </span>
        </Link>
      ))}
    </nav>
  );
}

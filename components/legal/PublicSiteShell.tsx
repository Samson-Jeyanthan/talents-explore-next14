import Link from "next/link";
import type { ReactNode } from "react";
import Theme from "@/components/options/Theme";
import { PUBLIC_SITE_LINKS } from "@/lib/legal-links";

export default function PublicSiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-dark-200 text-light-900">
      <a href="#public-content" className="sr-only focus:not-sr-only focus:p-3">
        Skip to content
      </a>
      <header className="border-b border-dark-400">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 p-5 sm:px-8">
          <Link href="/" className="text-xl font-semibold">
            Talents Explore
            <span className="mt-1 block text-xs font-normal text-light-600">
              Policy Centre
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="rounded-full bg-dark-300 px-5 py-2 text-sm hover:bg-dark-400"
            >
              Open web app
            </Link>
            <Theme />
          </div>
        </div>
        <nav
          aria-label="Policies and account"
          className="mx-auto flex max-w-6xl flex-wrap gap-x-5 gap-y-3 px-5 pb-5 text-sm text-light-700 sm:px-8"
        >
          {PUBLIC_SITE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-light-900 hover:underline"
            >
              {link.title}
            </Link>
          ))}
        </nav>
      </header>
      <main
        id="public-content"
        className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 sm:py-14"
      >
        {children}
      </main>
      <footer className="border-t border-dark-400">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-5 py-6 text-xs text-light-600 sm:px-8">
          <p>Talents Explore &copy; {new Date().getFullYear()}</p>
          <div className="flex flex-wrap gap-4">
            {PUBLIC_SITE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:underline"
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

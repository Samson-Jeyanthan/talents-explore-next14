import Link from "next/link";
import { PUBLIC_SITE_LINKS } from "@/lib/legal-links";

export default function PolicyCentre() {
  return (
    <>
      <p className="mb-3 text-sm font-medium text-light-600">TALENTS EXPLORE</p>
      <h1 className="text-3xl font-semibold leading-tight sm:text-5xl">
        Your community. Your privacy. Your choices.
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-light-700">
        Read our policies and understand our community standards. These pages
        are available without signing in.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PUBLIC_SITE_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-dark-400 bg-dark-250 p-6 transition-colors hover:bg-dark-300"
          >
            <h2 className="text-xl font-semibold">{link.title}</h2>
            <p className="mt-3 text-sm leading-6 text-light-700">
              {link.description}
            </p>
            <span className="mt-5 block text-sm font-medium">
              Read more &rarr;
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-sm text-light-600">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-light-900 underline">
          Sign in to the web app
        </Link>
        .
      </p>
    </>
  );
}

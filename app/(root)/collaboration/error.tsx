"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CollaborationError() {
  return (
    <section
      role="alert"
      className="mx-4 my-10 flex max-w-xl flex-col gap-4 rounded-2xl border border-dark-400 bg-dark-250 p-6 text-light-900"
    >
      <h1 className="text-xl font-semibold">Unable to load collaboration</h1>
      <p className="text-sm text-light-600">
        Please try again. Your saved collaborations have not been changed.
      </p>
      <Button
        type="button"
        className="shad-button_primary"
        onClick={() => window.location.reload()}
      >
        Try again
      </Button>
      <Link href="/home" className="text-sm underline">
        Back to home
      </Link>
    </section>
  );
}

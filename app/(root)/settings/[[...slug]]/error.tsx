"use client";

import { Button } from "@/components/ui/button";

export default function SettingsError() {
  return (
    <section
      role="alert"
      className="mx-4 my-12 flex max-w-xl flex-col gap-4 rounded-2xl border border-dark-300 bg-dark-250 p-6 text-light-900"
    >
      <h1 className="text-xl font-semibold">Settings couldn’t load</h1>
      <p>
        Please try again. If the problem continues, return to Settings in a
        moment.
      </p>
      <Button
        type="button"
        className="shad-button_primary"
        onClick={() => window.location.reload()}
      >
        Try again
      </Button>
    </section>
  );
}

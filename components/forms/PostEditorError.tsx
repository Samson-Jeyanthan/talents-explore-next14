"use client";

import { Button } from "@/components/ui/button";

export default function PostEditorError() {
  return (
    <section
      role="alert"
      className="mx-4 my-12 flex max-w-xl flex-col gap-4 rounded-2xl border border-dark-300 bg-dark-250 p-6 text-light-900"
    >
      <h1 className="text-xl font-semibold">Unable to load the editor</h1>
      <p>Please try again. Your saved content has not been changed.</p>
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

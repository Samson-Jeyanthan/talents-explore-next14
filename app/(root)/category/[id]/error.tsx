"use client";

import { Button } from "@/components/ui/button";

export default function CategoryError() {
  return (
    <section role="alert" className="m-8 flex flex-col gap-4 text-light-900">
      <h1 className="text-xl">Unable to load category content</h1>
      <p>Please try again in a moment.</p>
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

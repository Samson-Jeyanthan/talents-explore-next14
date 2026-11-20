"use client";

import { Button } from "@/components/ui/button";

export default function RetrySavedCollection() {
  return (
    <Button
      type="button"
      className="shad-button_secondary mt-3"
      onClick={() => window.location.reload()}
    >
      Try again
    </Button>
  );
}

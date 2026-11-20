"use client";
import { Button } from "@/components/ui/button";

export default function RetryExplore({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-dark-400 p-4 text-sm text-light-700"
    >
      <p>{message}</p>
      <Button
        type="button"
        className="shad-button_secondary mt-3"
        onClick={() => window.location.reload()}
      >
        Try again
      </Button>
    </div>
  );
}

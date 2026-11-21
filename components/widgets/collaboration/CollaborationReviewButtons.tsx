"use client";
import { useState } from "react";
import { reviewOptions } from "@/lib/utils/collaboration-workflow";
import { Button } from "@/components/ui/button";

export default function CollaborationReviewButtons({
  application,
  pending,
  onReview,
}: {
  application: any;
  pending: boolean;
  onReview: (action: string) => void;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      {reviewOptions(application).map((option) => (
        <Button
          key={option.action}
          type="button"
          disabled={pending}
          className="rounded-full bg-dark-200 text-light-900 hover:bg-dark-300"
          onClick={() => {
            if (option.action === "REJECT") setConfirm(true);
            else onReview(option.action);
          }}
        >
          {option.label}
        </Button>
      ))}
      {confirm ? (
        <div
          role="alert"
          className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-dark-300 p-3"
        >
          <p className="w-full text-sm text-light-700">
            Reject this applicant for this role?
          </p>
          <Button
            type="button"
            disabled={pending}
            onClick={() => {
              setConfirm(false);
              onReview("REJECT");
            }}
          >
            Confirm rejection
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={() => setConfirm(false)}
          >
            Cancel
          </Button>
        </div>
      ) : null}
    </div>
  );
}

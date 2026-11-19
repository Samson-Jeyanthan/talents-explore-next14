"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { submitReportAction } from "@/actions/report.action";
import {
  REPORT_REASONS,
  reportValidation,
  ReportTargetType,
} from "@/lib/validations/report.validation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTargetType;
  targetId: string;
  title: string;
};

export default function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
  title,
}: Props) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  useEffect(() => {
    if (open) {
      setReason("");
      setDescription("");
      setErrors({});
    }
  }, [open, targetId, targetType]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    const parsed = reportValidation.safeParse({
      targetType,
      targetId,
      reason,
      description,
    });
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        fields[String(issue.path[0])] = issue.message;
      setErrors(fields);
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setErrors({});
    try {
      const result = await submitReportAction(parsed.data);
      if (!result.success) {
        setErrors({ submit: result.message });
        return;
      }
      toast.success(result.message);
      onOpenChange(false);
    } catch {
      setErrors({ submit: "Unable to submit your report. Please try again." });
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!inFlight.current) onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl border-dark-300 bg-dark-250 text-light-900">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Please choose a reason and describe the problem.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          aria-busy={submitting}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="report-reason" className="text-sm">
              Reason
            </label>
            <select
              id="report-reason"
              name="reason"
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setErrors({});
              }}
              disabled={submitting}
              aria-invalid={Boolean(errors.reason)}
              aria-describedby={
                errors.reason ? "report-reason-error" : undefined
              }
              className="min-h-11 w-full rounded-lg border border-dark-300 bg-dark-200 px-3 py-2 text-sm text-light-900"
            >
              <option value="">Select a reason</option>
              {REPORT_REASONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            {errors.reason && (
              <p
                id="report-reason-error"
                role="alert"
                className="text-sm text-red-500"
              >
                {errors.reason}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="report-description" className="text-sm">
              Details
            </label>
            <textarea
              id="report-description"
              name="description"
              rows={5}
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setErrors({});
              }}
              disabled={submitting}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? "report-description-error" : undefined
              }
              placeholder="Please provide more details about the problem"
              className="w-full rounded-lg border border-dark-300 bg-dark-200 px-3 py-2 text-sm text-light-900"
            />
            {errors.description && (
              <p
                id="report-description-error"
                role="alert"
                className="text-sm text-red-500"
              >
                {errors.description}
              </p>
            )}
          </div>
          {(errors.submit || errors.targetId || errors.targetType) && (
            <p role="alert" className="text-sm text-red-500">
              {errors.submit || errors.targetId || errors.targetType}
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              className="shad-button_secondary"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="shad-button_primary"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

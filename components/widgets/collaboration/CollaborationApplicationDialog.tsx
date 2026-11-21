"use client";
import { useRef, useState } from "react";
import { applyToCollaborationRoleAction } from "@/actions/collaboration.action";
import { useCollaborationWrite } from "@/lib/hooks/useCollaborationWorkflow";
import { uploadFileToStorage, type UploadedFile } from "@/lib/utils/uploadFile";
import { resumeFileError } from "@/lib/utils/collaboration-workflow";
import { collaborationSelection } from "@/lib/utils/collaboration-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Draft = {
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  message: string;
  file: File | null;
};
export default function CollaborationApplicationDialog({
  collaborationId,
  role,
  currentUser,
  onClose,
  onApplied,
}: {
  collaborationId: string;
  role: any;
  currentUser: any;
  onClose: () => void;
  onApplied: (roleId: string) => Promise<void>;
}) {
  const roleId = collaborationSelection(role);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const uploads = useRef(new Map<File, UploadedFile>());
  const write = useCollaborationWrite(collaborationId);
  const initial: Draft = {
    applicantName: [
      currentUser?.personalInfo?.firstName,
      currentUser?.personalInfo?.lastName,
    ]
      .filter(Boolean)
      .join(" "),
    applicantEmail: currentUser?.email || "",
    applicantPhone: currentUser?.phone || "",
    message: "",
    file: null,
  };
  const draft = drafts[roleId] || initial;
  const change = (patch: Partial<Draft>) => {
    write.setError("");
    setDrafts((previous) => ({
      ...previous,
      [roleId]: { ...(previous[roleId] || initial), ...patch },
    }));
  };
  const submit = async () => {
    if (
      !draft.applicantName.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.applicantEmail.trim())
    ) {
      write.setError("Enter your full name and a valid contact email.");
      return;
    }
    const file = draft.file;
    if (!file) {
      write.setError("Add your CV or résumé before sending your application.");
      return;
    }
    const error = resumeFileError(file);
    if (error) {
      write.setError(error);
      return;
    }
    await write.run(
      async () => {
        let uploaded = uploads.current.get(file);
        if (!uploaded) {
          uploaded = await uploadFileToStorage(
            file,
            "collaboration-resume",
            currentUser?.userName || "user",
          );
          uploads.current.set(file, uploaded);
        }
        return applyToCollaborationRoleAction(collaborationId, {
          collaborationRoleId: roleId,
          applicantName: draft.applicantName.trim(),
          applicantEmail: draft.applicantEmail.trim(),
          applicantPhone: draft.applicantPhone.trim(),
          message: draft.message.trim(),
          resumeFileUrl: uploaded.url,
          resumeFileKey: uploaded.key,
        });
      },
      async () => {
        setDrafts((previous) => {
          const next = { ...previous };
          delete next[roleId];
          return next;
        });
        uploads.current.delete(file);
        onClose();
        await onApplied(roleId);
      },
    );
  };
  return (
    <Dialog
      open={!!roleId}
      onOpenChange={(open) => {
        if (!open && !write.pending) {
          write.setError("");
          onClose();
        }
      }}
    >
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-[28px] border-dark-300 bg-dark-200 text-light-900"
        onEscapeKeyDown={(event) => {
          if (write.pending) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (write.pending) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Send interest</DialogTitle>
          <DialogDescription>
            Apply for {role?.name || "this role"}. Add your CV or résumé and
            contact details.
          </DialogDescription>
        </DialogHeader>
        <fieldset
          disabled={write.pending}
          aria-busy={write.pending}
          className="grid min-w-0 gap-3"
        >
          <label className="grid gap-2 text-sm">
            CV / Résumé *
            <span className="cursor-pointer rounded-xl border border-dark-300 bg-dark-250 px-4 py-3 text-light-900">
              {draft.file ? "Replace CV / resume" : "Choose CV / resume"}
            </span>
            <input
              className="sr-only"
              type="file"
              accept=".pdf,.docx,image/jpeg,image/png,image/webp,image/gif"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                const error = resumeFileError(file);
                if (error) {
                  write.setError(error);
                  return;
                }
                change({ file });
              }}
            />
          </label>
          <p className="break-words text-sm text-light-600">
            {draft.file?.name ||
              "PDF, DOCX, JPG, PNG, WebP, or GIF. Maximum 20 MB."}
          </p>
          {draft.file ? (
            <Button type="button" onClick={() => change({ file: null })}>
              Remove résumé
            </Button>
          ) : null}
          <label className="grid gap-2 text-sm">
            Full name *
            <Input
              value={draft.applicantName}
              onChange={(event) =>
                change({ applicantName: event.target.value })
              }
              autoComplete="name"
            />
          </label>
          <label className="grid gap-2 text-sm">
            Contact email *
            <Input
              type="email"
              value={draft.applicantEmail}
              onChange={(event) =>
                change({ applicantEmail: event.target.value })
              }
              autoComplete="email"
            />
          </label>
          <label className="grid gap-2 text-sm">
            Contact number
            <Input
              type="tel"
              value={draft.applicantPhone}
              onChange={(event) =>
                change({ applicantPhone: event.target.value })
              }
              autoComplete="tel"
            />
          </label>
          <label className="grid gap-2 text-sm">
            Additional relevant information
            <Textarea
              value={draft.message}
              onChange={(event) => change({ message: event.target.value })}
              className="min-h-[120px]"
            />
          </label>
        </fieldset>
        {write.error ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {write.error}
          </p>
        ) : null}
        <DialogFooter className="gap-2">
          <Button
            type="button"
            disabled={write.pending}
            onClick={() => {
              write.setError("");
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={write.pending}
            onClick={submit}
            className="shad-button_primary"
          >
            {write.pending ? "Sending..." : "Send application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

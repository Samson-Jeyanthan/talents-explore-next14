"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { saveProfileAwardAction } from "@/actions/profile-awards.action";
import {
  awardKey,
  certificateFileError,
  certificateUrl,
  profileAwardValidation,
} from "@/lib/utils/profile-awards";
import { uploadFileToStorage, type UploadedFile } from "@/lib/utils/uploadFile";
import { useProfileAwardWrite } from "@/lib/hooks/useProfileAwardWrite";
import CertificateInput from "@/components/inputs/CertificateInput";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProfileAwardEditor({
  isOpen,
  onClose,
  data,
  isEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  data?: any;
  isEdit: boolean;
}) {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const selection = isEdit ? awardKey(data) : "new";
  const write = useProfileAwardWrite(`${params.userId}:${selection}:${isOpen}`);
  const [name, setName] = useState("");
  const [givenBy, setGivenBy] = useState("");
  const [year, setYear] = useState("");
  const [file, setFile] = useState<File | null | undefined>(undefined);
  const uploaded = useRef<{ file: File; result: UploadedFile } | null>(null);
  const initial = useRef(data);
  initial.current = data;
  useEffect(() => {
    if (!isOpen) return;
    const row = initial.current;
    setName(row?.name || "");
    setGivenBy(row?.givenBy || "");
    setYear(row?.year == null ? "" : String(row.year));
    setFile(undefined);
    uploaded.current = null;
  }, [isOpen, selection]);
  const oldUrl = certificateUrl(data);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const details = profileAwardValidation
      .omit({ certificateUrl: true, certificateUrlKey: true })
      .safeParse({ name, givenBy, year });
    if (!details.success) {
      write.setError(details.error.issues[0].message);
      return;
    }
    if (!file && (file === null || !oldUrl)) {
      write.setError("Choose a certificate file before saving.");
      return;
    }
    if (file) {
      const error = certificateFileError(file);
      if (error) {
        write.setError(error);
        return;
      }
    }
    await write.run(
      async (active) => {
        let url = oldUrl;
        let key = data?.certificateUrlKey || data?.fileKey || "";
        if (file) {
          if (uploaded.current?.file !== file) {
            uploaded.current = {
              file,
              result: await uploadFileToStorage(
                file,
                "award-certificate",
                params.userId,
              ),
            };
          }
          url = uploaded.current.result.url;
          key = uploaded.current.result.key;
        }
        if (!active()) return;
        return saveProfileAwardAction({
          profileId: params.userId,
          ...(isEdit ? { awardId: selection } : {}),
          award: {
            ...details.data,
            certificateUrl: url,
            certificateUrlKey: key,
          },
        });
      },
      () => {
        onClose();
        router.refresh();
      },
    );
  };
  const currentYear = new Date().getFullYear();
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !write.pending) onClose();
      }}
    >
      <DialogContent
        className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl border-dark-400 bg-dark-250 text-light-900"
        onEscapeKeyDown={(event) => {
          if (write.pending) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (write.pending) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit award or certificate" : "Add award or certificate"}
          </DialogTitle>
          <DialogDescription>
            Include the issuing authority, award year, and certificate document.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <fieldset
            disabled={write.pending}
            aria-busy={write.pending}
            className="grid min-w-0 gap-4"
          >
            <label className="grid gap-2 text-sm">
              Award / certificate name *
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="off"
              />
            </label>
            <label className="grid gap-2 text-sm">
              Given by / issuing authority *
              <Input
                value={givenBy}
                onChange={(event) => setGivenBy(event.target.value)}
                autoComplete="off"
              />
            </label>
            <label className="grid gap-2 text-sm">
              Year *
              <select
                value={year}
                onChange={(event) => setYear(event.target.value)}
                className="shad-form-input"
              >
                <option value="">Choose year</option>
                {Number(year) > 0 && Number(year) < 1901 ? (
                  <option value={year}>{year}</option>
                ) : null}
                {Array.from(
                  { length: currentYear - 1900 },
                  (_, i) => currentYear - i,
                ).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-2">
              <p className="text-sm">Certificate file *</p>
              <CertificateInput
                values={file === undefined ? (oldUrl ? data : null) : file}
                disabled={write.pending}
                fieldChange={(value) => {
                  setFile(value);
                  uploaded.current = null;
                  write.setError("");
                }}
              />
            </div>
          </fieldset>
          {write.error ? (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {write.error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              disabled={write.pending}
              onClick={onClose}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={write.pending}
              className="shad-button_primary"
            >
              {write.pending
                ? "Saving..."
                : isEdit
                  ? "Save changes"
                  : "Add award"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

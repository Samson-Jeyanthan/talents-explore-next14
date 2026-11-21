"use client";
import { useId, useState } from "react";
import {
  certificateFileError,
  certificateName,
  certificateUrl,
} from "@/lib/utils/profile-awards";
import { Button } from "@/components/ui/button";

export default function CertificateInput({
  fieldChange,
  values,
  disabled = false,
}: {
  fieldChange: (value: File | null) => void;
  values: any;
  disabled?: boolean;
}) {
  const id = useId();
  const [error, setError] = useState("");
  const existing =
    typeof values === "string"
      ? certificateUrl({ certificateUrl: values })
      : certificateUrl(values);
  const selected = values != null && values !== "";
  return (
    <div className="grid min-w-0 gap-2">
      <label
        htmlFor={id}
        className="cursor-pointer rounded-xl border border-dashed border-dark-400 bg-dark-200 p-4 text-sm text-light-800 focus-within:ring-2 focus-within:ring-primary-500"
      >
        <span>{selected ? "Replace certificate" : "Choose certificate"}</span>
        <input
          id={id}
          className="sr-only"
          type="file"
          disabled={disabled}
          accept=".pdf,.docx,image/jpeg,image/png,image/webp,image/gif"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            const message = certificateFileError(file);
            if (message) {
              setError(message);
              return;
            }
            setError("");
            fieldChange(file);
          }}
        />
      </label>
      <p className="break-words text-xs text-light-600">
        {selected
          ? certificateName(values)
          : "PDF, DOCX, JPG, PNG, WebP, or GIF. Maximum 20 MB."}
      </p>
      {existing ? (
        <a
          href={existing}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary-500 underline"
        >
          Open existing certificate
        </a>
      ) : null}
      {selected ? (
        <Button
          type="button"
          disabled={disabled}
          variant="ghost"
          className="justify-self-start"
          onClick={() => {
            setError("");
            fieldChange(null);
          }}
        >
          Remove certificate
        </Button>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}

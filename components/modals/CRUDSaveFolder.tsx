"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "../ui/input";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createSaveCollectionFolderAction,
  deleteSaveCollectionFolderAction,
  editSaveCollectionFolderAction,
} from "@/actions/save.action";

export default function CRUDSaveFolder({
  isFor,
  isOpen,
  folderId,
  folderName,
  onClick,
}: {
  isFor: "CREATE" | "EDIT" | "DELETE";
  isOpen: boolean;
  folderId: string;
  folderName: string;
  onClick: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState(folderName || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  useEffect(() => {
    if (isOpen) {
      setValue(isFor === "CREATE" ? "" : folderName);
      setError("");
    }
  }, [isOpen, folderName, isFor]);
  async function submit() {
    if (inFlight.current || (isFor !== "DELETE" && !value.trim())) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const result =
        isFor === "CREATE"
          ? await createSaveCollectionFolderAction("", value)
          : isFor === "EDIT"
            ? await editSaveCollectionFolderAction(folderId, value)
            : await deleteSaveCollectionFolderAction(folderId);
      if (result?.status !== "7400") {
        setError(
          result?.message ||
            "Unable to update the collection. Please try again.",
        );
        return;
      }
      toast.success(
        isFor === "DELETE"
          ? "Collection deleted"
          : isFor === "EDIT"
            ? "Collection renamed"
            : "Collection created",
      );
      setValue("");
      onClick();
      router.refresh();
    } catch {
      setError("Unable to update the collection. Please try again.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next && !inFlight.current) onClick();
      }}
    >
      <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl border-dark-400 bg-dark-250 p-4 text-light-900 sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isFor === "CREATE"
              ? "Create collection"
              : isFor === "EDIT"
                ? "Rename collection"
                : "Delete collection?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isFor === "DELETE"
              ? `Delete "${folderName}"? The saved posts themselves will remain available.`
              : "Choose a name for your collection."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {isFor !== "DELETE" && (
          <Input
            aria-label="Collection name"
            disabled={busy}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="shad-form-input"
          />
        )}
        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy} className="shad-button_secondary">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={
              busy ||
              (isFor !== "DELETE" &&
                (!value.trim() ||
                  (isFor === "EDIT" && value.trim() === folderName.trim())))
            }
            onClick={(event) => {
              event.preventDefault();
              return submit();
            }}
            className="shad-button_primary"
          >
            {busy
              ? "Saving..."
              : isFor === "DELETE"
                ? "Delete"
                : isFor === "EDIT"
                  ? "Save name"
                  : "Create"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

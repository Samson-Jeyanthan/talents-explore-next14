"use client";

import { useParams, useRouter } from "next/navigation";
import { deleteProfileLanguageAction } from "@/actions/profile-languages.action";
import { useProfileAwardWrite as useProfileWrite } from "@/lib/hooks/useProfileAwardWrite";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ILanguage } from "@/types/profile.types";

export default function ProfileLanguageDeleteDialog({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data?: ILanguage;
}) {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const entryId = typeof data?._id === "string" ? data._id : "";
  const write = useProfileWrite(`${params.userId}:${entryId}:${isOpen}`);
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !write.pending) onClose();
      }}
    >
      <AlertDialogContent
        className="max-h-[90vh] w-[calc(100%-2rem)] overflow-y-auto rounded-3xl border-dark-400 bg-dark-250 text-light-900"
        aria-busy={write.pending}
        onEscapeKeyDown={(event) => {
          if (write.pending) event.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Delete language detail?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes {data?.languageName || "this language"} from your
            profile.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {write.error && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {write.error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button type="button" disabled={write.pending} variant="ghost">
              Cancel
            </Button>
          </AlertDialogCancel>
          <Button
            type="button"
            disabled={write.pending || !entryId}
            className="shad-button_primary"
            onClick={() =>
              write.run(
                () => deleteProfileLanguageAction(params.userId, entryId),
                () => {
                  onClose();
                  router.refresh();
                },
              )
            }
          >
            {write.pending ? "Deleting..." : "Delete language"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

"use client";
import { useParams, useRouter } from "next/navigation";
import { deleteProfileAwardAction } from "@/actions/profile-awards.action";
import { awardKey } from "@/lib/utils/profile-awards";
import { useProfileAwardWrite } from "@/lib/hooks/useProfileAwardWrite";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function ProfileAwardDeleteDialog({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}) {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const key = awardKey(data);
  const write = useProfileAwardWrite(`${params.userId}:${key}:${isOpen}`);
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !write.pending) onClose();
      }}
    >
      <AlertDialogContent className="rounded-3xl border-dark-400 bg-dark-250 text-light-900">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete award or certificate?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes {data?.name || "this award"} from your profile.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {write.error ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {write.error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <Button
            type="button"
            disabled={write.pending}
            onClick={onClose}
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={write.pending}
            className="shad-button_primary"
            onClick={() =>
              write.run(
                () => deleteProfileAwardAction(params.userId, key),
                () => {
                  onClose();
                  router.refresh();
                },
              )
            }
          >
            {write.pending ? "Deleting..." : "Delete award"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

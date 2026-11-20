"use client";

import { Button } from "../ui/button";
import { useEffect, useState } from "react";
import { useUserContext } from "@/context/AuthProvider";
import { useParams, useRouter } from "next/navigation";
import { useFollowConnection } from "@/lib/hooks/useFollowConnection";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface ConnectionButtonProps {
  isFollow: number | boolean | string;
  userId: string;
  userName: string;
  connectionTab?: number;
  className?: string;
  onChanged?: (following: boolean) => void;
}
export default function ConnectionButton({
  isFollow,
  userId,
  userName,
  connectionTab,
  className,
  onChanged,
}: ConnectionButtonProps) {
  const { user } = useUserContext();
  const params = useParams();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const connection = useFollowConnection(
    userId,
    user?.currentUserId || "",
    isFollow,
    onChanged,
  );
  const ownList = user?.currentUserId === params.userId && connectionTab === 2;
  useEffect(() => {
    setConfirm(false);
  }, [userId, user?.currentUserId]);
  async function change(next: boolean) {
    if (await connection.change(next)) {
      setConfirm(false);
      router.refresh();
    }
  }
  if (!user?.currentUserId) return null;
  if (user.currentUserId === userId)
    return (
      <span className="flex h-8 w-24 shrink-0 items-center justify-center text-sm text-light-600">
        You
      </span>
    );
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <Button
        type="button"
        disabled={connection.pending}
        aria-pressed={connection.following}
        aria-busy={connection.pending}
        aria-label={`${connection.following ? "Unfollow" : "Follow"} @${userName}`}
        className={cn(
          "h-8 min-w-24 shrink-0 gap-2 rounded-full px-3 text-sm",
          connection.following
            ? "border border-primary-500 bg-transparent text-primary-500 hover:bg-primary-500/10"
            : "bg-primary-500 text-white hover:bg-primary-500/90",
          className,
        )}
        onClick={() => (connection.following ? setConfirm(true) : change(true))}
      >
        {connection.pending && (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        )}
        {connection.pending
          ? "Updating..."
          : connection.following
            ? ownList
              ? "Unfollow"
              : "Following"
            : "Follow"}
      </Button>
      {connection.error && !confirm && (
        <p
          role="alert"
          className="max-w-40 text-right text-xs text-primary-500"
        >
          {connection.error} Try again.
        </p>
      )}
      <AlertDialog
        open={confirm}
        onOpenChange={(next) => {
          if (!connection.pending) setConfirm(next);
        }}
      >
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] rounded-2xl border-dark-400 bg-dark-250 text-light-900 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Unfollow @{userName}?</AlertDialogTitle>
            <AlertDialogDescription className="text-light-600">
              You will stop following this account. You can follow them again
              later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {connection.error && (
            <p role="alert" className="text-sm text-primary-500">
              {connection.error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={connection.pending}
              className="shad-button_secondary"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={connection.pending}
              className="shad-button_primary"
              onClick={(event) => {
                event.preventDefault();
                return change(false);
              }}
            >
              {connection.pending ? "Unfollowing..." : "Unfollow"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

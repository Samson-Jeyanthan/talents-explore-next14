"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, MoreVertical, Trash2 } from "lucide-react";
import { deleteConversationAction } from "@/actions/chat.action";
import ReportDialog from "@/components/modals/ReportDialog";
import { Button } from "@/components/ui/button";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { chatEntityId } from "@/lib/utils/chat-header";

export default function ChatHeaderActions({
  roomId,
  type,
  activeUserId,
  recipientId,
}: {
  roomId: string;
  type: "chat" | "request" | "group";
  activeUserId: string;
  recipientId: unknown;
}) {
  const router = useRouter();
  const [reportOpen, setReportOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const busy = useRef(false);
  const mounted = useRef(true);
  const dialogOpening = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const restoreFocus = (event: Event) => {
    event.preventDefault();
    trigger.current?.focus();
  };
  const recipient = chatEntityId(recipientId);
  const self = chatEntityId(activeUserId);
  const canReport =
    (type === "chat" || type === "request") &&
    !!self &&
    !!recipient &&
    recipient !== self;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const deleteConversation = async () => {
    if (busy.current || !confirmDelete) return;
    busy.current = true;
    setDeleting(true);
    setDeleteError("");
    try {
      const result = await deleteConversationAction(roomId);
      if (!mounted.current) return;
      if (result?.status !== "7400") {
        setDeleteError("Unable to delete this conversation. Please try again.");
        return;
      }
      setConfirmDelete(false);
      router.push("/chat");
      router.refresh();
    } catch {
      if (mounted.current)
        setDeleteError("Unable to delete this conversation. Please try again.");
    } finally {
      busy.current = false;
      if (mounted.current) setDeleting(false);
    }
  };

  return (
    <>
      <Menubar className="h-auto shrink-0 border-none bg-transparent p-0">
        <MenubarMenu>
          <MenubarTrigger
            ref={trigger}
            aria-label="Conversation options"
            disabled={deleting}
            className="cursor-pointer rounded-full bg-dark-200 p-3 text-light-500 hover:bg-dark-300 hover:text-light-900"
          >
            <MoreVertical className="size-4" />
          </MenubarTrigger>
          <MenubarContent
            align="end"
            className="min-w-56 rounded-xl border-dark-400 bg-dark-250 p-1 text-light-900"
            onCloseAutoFocus={(event) => {
              if (dialogOpening.current) {
                event.preventDefault();
                dialogOpening.current = false;
              }
            }}
          >
            {canReport && (
              <MenubarItem
                className="cursor-pointer gap-3 rounded-lg focus:bg-dark-300 focus:text-light-900"
                onSelect={() => {
                  dialogOpening.current = true;
                  setReportOpen(true);
                }}
              >
                <Flag className="size-4" />
                Report this account
              </MenubarItem>
            )}
            <MenubarItem
              className="cursor-pointer gap-3 rounded-lg text-red-700 focus:bg-dark-300 focus:text-red-700 dark:text-red-300 dark:focus:text-red-300"
              onSelect={() => {
                dialogOpening.current = true;
                setDeleteError("");
                setConfirmDelete(true);
              }}
            >
              <Trash2 className="size-4" />
              Delete this conversation
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      {canReport && (
        <ReportDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          targetType="profile"
          targetId={recipient!}
          title="Report this account"
          onCloseAutoFocus={restoreFocus}
        />
      )}
      <AlertDialog
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!busy.current) {
            setConfirmDelete(open);
            if (!open) setDeleteError("");
          }
        }}
      >
        <AlertDialogContent
          onCloseAutoFocus={restoreFocus}
          className="rounded-2xl border-dark-300 bg-dark-250 text-light-900"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription className="text-light-600">
              This removes the conversation from your chat history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="border-dark-300 bg-dark-200 text-light-900"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={deleteConversation}
            >
              {deleting ? "Deleting..." : "Delete conversation"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

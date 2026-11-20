"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getCommentsAction,
  deleteCommentAction,
} from "@/actions/comment.action";
import { useUserContext } from "@/context/AuthProvider";
import { useCommentPages } from "@/lib/hooks/useCommentPages";
import { normalizeComment } from "@/lib/utils/commentPages";
import CommentInput, { CommentSent } from "@/components/inputs/CommentInput";
import CommentCard from "@/components/cards/CommentCard";
import { Button } from "@/components/ui/button";
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
import type { ICommentAuthor } from "@/types/post.types";

export default function CommentThread({
  postId,
  numberOfComments,
  canComment = true,
  commentType,
  postAuthorId,
}: {
  postId: string;
  numberOfComments: number;
  canComment?: boolean;
  commentType: "MODAL" | "PAGE";
  postAuthorId?: string;
}) {
  const { user } = useUserContext();
  const pathname = usePathname();
  const loader = useCallback(
    async (page: number) => {
      const result = await getCommentsAction(postId, page);
      return result?.status === 200
        ? {
            items: result.response
              .map((value: unknown) =>
                normalizeComment(value, user.currentUserId),
              )
              .filter(Boolean),
          }
        : { message: result?.message };
    },
    [postId, user.currentUserId],
  );
  const pages = useCommentPages(loader);
  const [count, setCount] = useState(numberOfComments);
  const [reply, setReply] = useState<{
    id: string;
    rootId: string;
    author: ICommentAuthor;
  } | null>(null);
  const [addedReply, setAddedReply] = useState<
    (CommentSent & { serial: number }) | null
  >(null);
  const [deletedReply, setDeletedReply] = useState<{
    id: string;
    rootId: string;
    serial: number;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    rootId?: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const deleteInFlight = useRef(false);
  const serial = useRef(0);
  useEffect(() => {
    setCount(numberOfComments);
  }, [numberOfComments, postId]);
  useEffect(() => {
    if (!canComment) setReply(null);
  }, [canComment]);

  function sent(event: CommentSent) {
    if (!event.parentId) {
      if (event.comment) pages.prepend(event.comment);
      else pages.refresh();
      setCount((current) => Math.max(current, count + 1));
    } else {
      pages.update(event.parentId, (item) => ({
        ...item,
        totalReplies: item.totalReplies + 1,
      }));
      setAddedReply({ ...event, serial: ++serial.current });
    }
  }
  async function confirmDelete() {
    if (!deleteTarget || deleteInFlight.current) return;
    deleteInFlight.current = true;
    setDeleting(true);
    setDeleteError("");
    try {
      const result = await deleteCommentAction(
        deleteTarget.id,
        postId,
        pathname,
      );
      if (result.status !== "7400") {
        setDeleteError(result.message || "Unable to delete. Please try again.");
        return;
      }
      if (deleteTarget.rootId) {
        pages.update(deleteTarget.rootId, (item) => ({
          ...item,
          totalReplies: Math.max(0, item.totalReplies - 1),
        }));
        setAddedReply(null);
        setDeletedReply({
          id: deleteTarget.id,
          rootId: deleteTarget.rootId,
          serial: ++serial.current,
        });
      } else {
        setAddedReply(null);
        pages.refresh();
        setCount((current) => Math.max(0, Math.min(current, count - 1)));
      }
      if (reply?.id === deleteTarget.id || reply?.rootId === deleteTarget.id)
        setReply(null);
      setDeleteTarget(null);
    } catch {
      setDeleteError("Unable to delete. Please try again.");
    } finally {
      deleteInFlight.current = false;
      setDeleting(false);
    }
  }
  const composer = (
    <div className="mt-2 shrink-0 rounded-2xl border border-dark-400/50 bg-dark-250 p-3">
      {canComment ? (
        <>
          <p className="mb-3 text-xs font-semibold text-light-700">
            Add a comment
          </p>
          <CommentInput
            postId={postId}
            commentType={commentType}
            onSent={sent}
          />
        </>
      ) : (
        <p className="text-sm text-light-500">
          Comments are private for your current visibility level.
        </p>
      )}
    </div>
  );
  return (
    <section
      className={`flex min-h-0 w-full flex-col gap-4 ${commentType === "MODAL" ? "flex-1 overflow-hidden" : ""}`}
      aria-label="Comments"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-light-900">
          Comments{" "}
          <span className="ml-1 text-sm font-normal text-light-500">
            ({count})
          </span>
        </h2>
      </div>
      {commentType === "PAGE" && composer}
      <div
        className={`flex min-h-0 flex-col gap-4 ${commentType === "MODAL" ? "flex-1 overflow-y-auto overscroll-contain pr-1" : ""}`}
      >
        {pages.items.map((item) => (
          <CommentCard
            key={item._id}
            commentDetails={item}
            canReply={canComment}
            postAuthorId={postAuthorId}
            onReply={(id, author, rootId) =>
              setReply((current) =>
                current?.id === id ? null : { id, author, rootId },
              )
            }
            onDelete={(id, rootId) => {
              setDeleteError("");
              setDeleteTarget({ id, rootId });
            }}
            replyTargetId={reply?.rootId === item._id ? reply.id : undefined}
            inlineReply={
              canComment && reply?.rootId === item._id ? (
                <CommentInput
                  key={reply.id}
                  postId={postId}
                  commentType="INLINE"
                  author={reply.author}
                  replyCommentId={reply.id}
                  replyRootId={reply.rootId}
                  onCancelReply={() => setReply(null)}
                  onSent={(event) => {
                    sent(event);
                    setReply(null);
                  }}
                />
              ) : undefined
            }
            newReply={addedReply?.parentId === item._id ? addedReply : null}
            deletedReply={
              deletedReply?.rootId === item._id ? deletedReply : null
            }
          />
        ))}
        {pages.loading && (
          <p role="status" className="text-sm text-light-500">
            Loading comments...
          </p>
        )}
        {pages.error && (
          <p role="alert" className="text-sm text-red-500">
            {pages.error}
          </p>
        )}
        {!pages.loading && !pages.error && !pages.items.length && (
          <p className="text-sm text-light-500">
            No comments yet. Start the conversation.
          </p>
        )}
        {pages.hasMore && !pages.loading && (
          <Button
            type="button"
            className="shad-button_secondary"
            onClick={pages.load}
          >
            {pages.error ? "Try again" : "View more comments"}
          </Button>
        )}
      </div>
      {commentType === "MODAL" && composer}
      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deleting) {
            setDeleteTarget(null);
            setDeleteError("");
          }
        }}
      >
        <AlertDialogContent className="border-dark-400 bg-dark-250 text-light-900">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.rootId ? "reply" : "comment"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p role="alert" className="text-sm text-red-500">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="shad-button_secondary"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              aria-label="Confirm deletion"
              disabled={deleting}
              className="shad-button_primary"
              onClick={(event) => {
                event.preventDefault();
                return confirmDelete();
              }}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

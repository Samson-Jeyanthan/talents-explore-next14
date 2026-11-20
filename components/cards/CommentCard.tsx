"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getRepliesOfCommentAction } from "@/actions/comment.action";
import { useUserContext } from "@/context/AuthProvider";
import { useCommentPages } from "@/lib/hooks/useCommentPages";
import { normalizeComment } from "@/lib/utils/commentPages";
import { Button } from "@/components/ui/button";
import type { ICommentAuthor, IComments } from "@/types/post.types";
import type { CommentSent } from "@/components/inputs/CommentInput";
import CommentCardBody from "./CommentCardBody";

type Props = {
  commentDetails: IComments;
  canReply?: boolean;
  postAuthorId?: string;
  onReply: (id: string, author: ICommentAuthor, rootId: string) => void;
  onDelete?: (id: string, rootId?: string) => void;
  replyTargetId?: string;
  inlineReply?: ReactNode;
  newReply?: (CommentSent & { serial: number }) | null;
  deletedReply?: { id: string; serial: number } | null;
};

function Replies({
  commentDetails,
  canReply,
  onReply,
  newReply,
  deletedReply,
  postAuthorId,
  onDelete,
  replyTargetId,
  inlineReply,
}: Props) {
  const { user } = useUserContext();
  const loader = useCallback(
    async (page: number) => {
      const result = await getRepliesOfCommentAction(
        commentDetails._id,
        page,
        20,
      );
      return result?.status === "7400"
        ? {
            items: result.response
              .map((value: unknown) =>
                normalizeComment(value, user.currentUserId),
              )
              .filter(Boolean),
          }
        : { message: result?.message };
    },
    [commentDetails._id, user.currentUserId],
  );
  const pages = useCommentPages(loader);
  const { prepend, refresh } = pages;
  const handledDeletion = useRef(deletedReply?.serial);
  useEffect(() => {
    if (!newReply) return;
    if (newReply.comment) prepend(newReply.comment);
    else refresh();
  }, [newReply, prepend, refresh]);
  useEffect(() => {
    if (!deletedReply || deletedReply.serial === handledDeletion.current)
      return;
    handledDeletion.current = deletedReply.serial;
    refresh();
  }, [deletedReply, refresh]);
  return (
    <section
      aria-label={`Replies to ${commentDetails.author.userName}`}
      className="ml-4 rounded-2xl border-l-2 border-primary-500/20 bg-dark-300/35 p-3 dark:border-primary-500/50 sm:ml-10 sm:p-4"
    >
      <h3 className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-light-700">
        Replies to @{commentDetails.author.userName}
        <span className="rounded-full bg-dark-250 px-2 py-0.5 text-[10px] font-normal text-light-500">
          {pages.items.length} loaded
        </span>
      </h3>
      <div className="flex flex-col gap-4">
        {pages.items.map((item) => (
          <CommentCardBody
            key={item._id}
            commentDetails={item}
            canReply={canReply}
            isReply
            postAuthorId={postAuthorId}
            onDelete={
              onDelete
                ? () => onDelete(item._id, commentDetails._id)
                : undefined
            }
            inlineReply={replyTargetId === item._id ? inlineReply : undefined}
            onReply={() => onReply(item._id, item.author, commentDetails._id)}
          />
        ))}
        {pages.loading && (
          <p role="status" className="text-xs text-light-500">
            Loading replies...
          </p>
        )}
        {pages.error && (
          <p role="alert" className="text-sm text-red-500">
            {pages.error}
          </p>
        )}
        {!pages.loading && !pages.error && !pages.items.length && (
          <p className="text-xs text-light-500">No replies yet.</p>
        )}
        {!pages.loading && pages.hasMore && (
          <Button
            type="button"
            className="shad-button_secondary"
            onClick={pages.load}
          >
            {pages.error ? "Try again" : "View more replies"}
          </Button>
        )}
      </div>
    </section>
  );
}

export default function CommentCard(props: Props) {
  const {
    commentDetails,
    canReply,
    onReply,
    newReply,
    postAuthorId,
    onDelete,
    replyTargetId,
    inlineReply,
  } = props;
  const [open, setOpen] = useState(Boolean(newReply));
  useEffect(() => {
    if (newReply) setOpen(true);
  }, [newReply]);
  return (
    <article
      aria-label={`Comment by ${commentDetails.author.userName}`}
      className="flex flex-col gap-4 rounded-2xl border border-dark-400/50 bg-dark-250 p-3 shadow-sm sm:p-4"
    >
      <CommentCardBody
        commentDetails={commentDetails}
        canReply={canReply}
        postAuthorId={postAuthorId}
        onDelete={onDelete ? () => onDelete(commentDetails._id) : undefined}
        inlineReply={
          replyTargetId === commentDetails._id ? inlineReply : undefined
        }
        onReply={() =>
          onReply(commentDetails._id, commentDetails.author, commentDetails._id)
        }
        repliesOpen={open}
        onToggleReplies={() => setOpen((current) => !current)}
      />
      {open && <Replies {...props} />}
    </article>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Forward, X } from "lucide-react";
import UserProfileImg from "../others/UserProfileImg";
import { useUserContext } from "@/context/AuthProvider";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { SendIcon } from "@/public/assets/svgs";
import { EmojisOptions } from "../options";
import { addCommentAction, addReplyAction } from "@/actions/comment.action";
import { normalizeComment } from "@/lib/utils/commentPages";
import type { IComments, ICommentAuthor } from "@/types/post.types";

export type CommentSent = {
  comment: IComments | null;
  parentId: string | null;
};
type Props = {
  postId: string;
  commentType: "MODAL" | "PAGE" | "INLINE";
  author?: ICommentAuthor;
  replyCommentId?: string | null;
  replyRootId?: string;
  onCancelReply?: () => void;
  onSent: (event: CommentSent) => void;
};

export default function CommentInput({
  postId,
  commentType,
  author,
  replyCommentId,
  replyRootId,
  onCancelReply,
  onSent,
}: Props) {
  const { user } = useUserContext();
  const pathname = usePathname();
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textarea.current) {
      textarea.current.style.height = "40px";
      textarea.current.style.height = `${textarea.current.scrollHeight}px`;
    }
  }, [value]);
  useEffect(() => {
    if (replyCommentId) textarea.current?.focus();
  }, [replyCommentId]);

  async function submit() {
    const text = value.trim();
    if (inFlight.current || !text) return;
    inFlight.current = true;
    setSending(true);
    setError("");
    try {
      const res = replyCommentId
        ? await addReplyAction(
            postId,
            replyCommentId,
            text,
            pathname,
            replyRootId,
          )
        : await addCommentAction(postId, text, pathname);
      if (res?.status !== "7400") {
        setError(
          res?.message ||
            "Unable to send. Your text has been kept; please try again.",
        );
        return;
      }
      const created = normalizeComment(
        res.response && {
          ...res.response,
          comment: res.response.comment ?? text,
          createdAt: res.response.createdAt || new Date().toISOString(),
          author:
            res.response.author && typeof res.response.author === "object"
              ? res.response.author
              : {
                  _id: user.currentUserId,
                  userName: user.username,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  profileImage: user.imageUrl,
                },
        },
      );
      setValue("");
      onSent({
        comment: created,
        parentId: replyCommentId ? replyRootId || replyCommentId : null,
      });
      onCancelReply?.();
    } catch {
      setError("Unable to send. Your text has been kept; please try again.");
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }
  return (
    <div
      className={`flex w-full flex-col gap-2 ${commentType === "MODAL" ? "bg-dark-250 p-3" : "border-b border-dark-300 pb-4"}`}
    >
      {replyCommentId && (
        <div className="flex items-center justify-between gap-2 text-xs text-light-700">
          <p>Replying to @{author?.userName || "user"}</p>
          <button
            type="button"
            disabled={sending}
            aria-label="Cancel reply"
            onClick={onCancelReply}
            className="rounded p-2 text-light-700"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        {commentType !== "INLINE" && (
          <UserProfileImg
            userName={user.username}
            src={user.imageUrl}
            className="!size-[34px] !min-h-[34px] !min-w-[34px] rounded-lg"
          />
        )}
        <div className="min-w-0 flex-1">
          <Textarea
            ref={textarea}
            aria-label={replyCommentId ? "Reply" : "Comment"}
            disabled={sending}
            placeholder={
              replyCommentId ? "Write a reply..." : "Add a comment..."
            }
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="max-h-[120px] min-h-10 resize-none rounded-xl border border-dark-400 bg-dark-200 text-light-900 placeholder:text-light-500"
          />
        </div>
        {!sending && commentType !== "INLINE" && (
          <EmojisOptions
            onClick={(emoji: string) => setValue((current) => current + emoji)}
          />
        )}
        <Button
          type="button"
          aria-label={replyCommentId ? "Send reply" : "Send comment"}
          disabled={sending || !value.trim()}
          onClick={submit}
          className="shad-button_primary shrink-0 rounded-full px-3"
        >
          {sending ? (
            "Sending..."
          ) : replyCommentId ? (
            <Forward className="size-4" />
          ) : (
            <SendIcon width="16px" height="16px" />
          )}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

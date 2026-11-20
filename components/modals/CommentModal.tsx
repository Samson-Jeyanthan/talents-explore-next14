"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "../ui/dialog";
import { PostUtilsButton } from "../buttons";
import CommentThread from "@/components/widgets/postMoreDetails/CommentThread";

export default function CommentModal({
  postId,
  numberOfComments,
  buttonClassName,
  canComment = true,
  postAuthorId,
}: {
  postId: string;
  numberOfComments: number;
  buttonClassName?: string;
  canComment?: boolean;
  postAuthorId?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger aria-label="View comments">
        <PostUtilsButton
          buttonFor="COMMENT"
          className={buttonClassName}
          size="19px"
        />
      </DialogTrigger>
      <DialogContent
        className="flex h-[85dvh] max-h-[85dvh] w-[calc(100vw-2rem)] max-w-xl flex-col gap-4 overflow-hidden rounded-2xl border border-dark-400 bg-dark-250 p-4 text-light-900"
        aria-describedby={undefined}
      >
        <div className="flex items-center justify-between">
          <DialogTitle className="text-xl font-semibold">Comments</DialogTitle>
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Close comments"
              className="rounded-full p-2 hover:bg-dark-300"
            >
              <X className="size-5" />
            </button>
          </DialogClose>
        </div>
        {open && (
          <CommentThread
            key={postId}
            postId={postId}
            numberOfComments={numberOfComments}
            canComment={canComment}
            postAuthorId={postAuthorId}
            commentType="MODAL"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

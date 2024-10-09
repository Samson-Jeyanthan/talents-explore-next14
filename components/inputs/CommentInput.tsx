"use client";

import UserProfileImg from "../others/UserProfileImg";
import { useUserContext } from "@/context/AuthProvider";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { SendIcon } from "@/public/assets/svgs";
import { Textarea } from "../ui/textarea";
import { EmojisOptions } from "../options";
import { handleCommentSubmit } from "@/lib/functions/post.functions";

type Props = {
  postId: string;
  authorId?: string;
  commentType: "MODAL" | "PAGE";
};

const CommentInput = ({ postId, authorId, commentType }: Props) => {
  const { user } = useUserContext();
  const [commentValue, setCommentValue] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null); // Reference to the textarea

  useEffect(() => {
    if (textAreaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textAreaRef.current.style.height = "40px";

      // Set height based on scrollHeight
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [commentValue]);

  const handleEmojiClick = (emoji: string) => {
    setCommentValue((prev) => prev + emoji);
  };

  const handleSubmit = () => {
    if (commentValue) {
      handleCommentSubmit(
        user.currentUserId,
        postId,
        commentValue,
        `/post/${postId}`
      );
    }
    setCommentValue("");
  };

  return (
    <div
      className={`${commentType === "MODAL" ? "border-t px-4 pb-1 pt-3" : "border-b pb-4"} flex h-auto w-full items-start gap-3 border-solid border-dark-300`}
    >
      <UserProfileImg
        userName={user.username}
        src={user.imageUrl}
        className="!size-[34px] max-h-[34px] !min-w-[34px] rounded-lg"
      />
      <EmojisOptions onClick={handleEmojiClick} />
      <div
        className={`${commentType === "MODAL" ? "" : "flex-col"} flex w-full items-end gap-3`}
      >
        <Textarea
          ref={textAreaRef}
          placeholder="Add a comment"
          className="max-h-[180px] min-h-[40px] resize-none rounded-xl border-2 border-solid border-dark-300 bg-dark-200 leading-5 text-light-900 outline-none ring-offset-dark-300 placeholder:text-light-500 focus:outline-dark-400 focus-visible:ring-1 focus-visible:ring-dark-400 focus-visible:ring-offset-1"
          value={commentValue}
          onChange={(e) => setCommentValue(e.target.value)}
        />
        {commentValue && (
          <Button
            className="flex h-8 gap-2 rounded-full border-none bg-primary-500 fill-light-900 px-3 text-[13px] text-light-900"
            onClick={handleSubmit}
          >
            Add
            <SendIcon width="16px" height="16px" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default CommentInput;

"use client";

import UserProfileImg from "../others/UserProfileImg";
import { useUserContext } from "@/context/AuthProvider";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { SendIcon } from "@/public/assets/svgs";
import { Textarea } from "../ui/textarea";
import { EmojisOptions } from "../options";
import { Forward, XIcon } from "lucide-react";
import { ICommentAuthor } from "@/types/post.types";
import { addCommentAction, addReplyAction } from "@/actions/comment.action";

type Props = {
  postId: string;
  author?: ICommentAuthor;
  commentType: "MODAL" | "PAGE";
  replyCommentId?: string | null;
  setReplyCommentId?: React.Dispatch<
    React.SetStateAction<{
      commentId: string | null;
      author: ICommentAuthor | undefined;
    }>
  >;
  setData?: React.Dispatch<React.SetStateAction<any[]>>;
  // setIsReplyOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const CommentInput = ({
  postId,
  author,
  commentType,
  replyCommentId,
  setReplyCommentId,
  setData,
  // setIsReplyOpen,
}: Props) => {
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

  const handleSubmit = async (commentType: "REPLY" | "COMMENT") => {
    if (commentValue) {
      if (commentType === "REPLY") {
        const res = await addReplyAction(
          postId,
          replyCommentId,
          commentValue,
          "/home"
        );
        if (res.status === "7400") {
          setData && setData((prev) => [res.response, ...prev]);
          setReplyCommentId?.({ commentId: null, author: undefined });
          setCommentValue("");
        }
      } else {
        const res = await addCommentAction(postId, commentValue, "/home");
        if (res.status === "7400") {
          setData && setData((prev) => [res.response, ...prev]);
          // setIsReplyOpen && setIsReplyOpen(false);
          setCommentValue("");
        }
      }
    }
    setCommentValue("");
  };

  return (
    <div className="flex w-full flex-col rounded-b-2xl bg-dark-250">
      {replyCommentId && (
        <div className="flex w-full items-center justify-between gap-2 border-t border-solid border-dark-300 px-4 py-2">
          <p className="flex gap-2 text-start text-[13px] text-light-500">
            Replying to{" "}
            <span className="font-medium lowercase text-light-900">
              @{author?.userName}
            </span>
          </p>
          <span
            className="cursor-pointer text-light-500"
            onClick={() =>
              setReplyCommentId?.({ commentId: null, author: undefined })
            }
          >
            <XIcon width="14px" height="14px" />
          </span>
        </div>
      )}
      <div
        className={`${commentType === "MODAL" ? "border-t px-4 pb-1 pt-3" : "border-b pb-4"} flex h-auto w-full items-center gap-3 rounded-b-3xl border-solid border-dark-300`}
      >
        <UserProfileImg
          userName={user.username}
          src={user.imageUrl}
          className="!size-[34px] !min-h-[34px] !min-w-[34px] rounded-lg"
        />
        <EmojisOptions onClick={handleEmojiClick} />
        <div
          className={`${commentType === "MODAL" ? "items-center" : "flex-col items-end "} flex w-full gap-3`}
        >
          <Textarea
            ref={textAreaRef}
            placeholder={`${replyCommentId ? "Reply" : "Add a Comment"}...`}
            className="max-h-[120px] min-h-[40px] resize-none rounded-xl border-2 border-solid border-dark-300 bg-dark-200 leading-5 text-light-900 outline-none ring-offset-dark-300 placeholder:text-light-500 focus:outline-dark-400 focus-visible:ring-1 focus-visible:ring-dark-400 focus-visible:ring-offset-1"
            value={commentValue}
            onChange={(e) => setCommentValue(e.target.value)}
          />
          {commentValue && (
            <Button
              className="flex h-8 gap-2 rounded-full border-none bg-primary-500 fill-light-900 px-3 text-[13px] text-light-900"
              onClick={() => handleSubmit(replyCommentId ? "REPLY" : "COMMENT")}
            >
              {commentType === "PAGE" && <>Add</>}
              {replyCommentId ? (
                <Forward width="16px" height="16px" />
              ) : (
                <SendIcon width="16px" height="16px" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentInput;

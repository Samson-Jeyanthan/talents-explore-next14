"use client";

import Link from "next/link";
import React, { useRef, useState } from "react";
import UserProfileImg from "../others/UserProfileImg";
import { ICommentAuthor, IComments } from "@/types/post.types";
import { BsDot } from "react-icons/bs";
import { getFormattedDate } from "@/lib/utils";
import { Forward, Heart } from "lucide-react";
import { addReplyAction, commentLikeAction } from "@/actions/comment.action";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { SendIcon } from "@/public/assets/svgs";
import { useParams, usePathname } from "next/navigation";

const CommentCardBody = ({
  commentType,
  commentDetails,
  canReply,
  handleViewReplies,
  isReply,
  isReplyOpen,
  handleIsReplyComment,
}: {
  commentType: "PAGE" | "MODAL";
  commentDetails: IComments;
  canReply?: boolean;
  handleViewReplies?: () => void;
  isReply?: boolean;
  isReplyOpen?: boolean;
  handleIsReplyComment?: (commentId: string, author: ICommentAuthor) => void;
}) => {
  const profilePath = `/profile/${commentDetails.author.userName}/${commentDetails.author._id}`;
  const [isLiked, setIsLiked] = useState(commentDetails.isLiked);
  const [totalLikes, setTotalLikes] = useState(commentDetails.totalLikes);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [commentValue, setCommentValue] = useState("");
  const [replyId, setReplyId] = useState<string | null>(null);
  const params = useParams<{ id: string }>();
  const pathname = usePathname();

  const handleLike = async () => {
    const res = await commentLikeAction(commentDetails._id);
    if (res.status === "7400") {
      setIsLiked(res.response.liked);
      setTotalLikes(res.response.totalLikes);
    }
  };

  const handleReply = (id: string, author: ICommentAuthor) => {
    if (commentType === "MODAL") {
      handleIsReplyComment?.(id, author);
    } else {
      console.log(id);
      setReplyId(id);
    }
  };

  const handleCancel = () => {
    setReplyId(null);
    setCommentValue("");
  };

  const handleSubmit = async () => {
    if (commentValue) {
      const res = await addReplyAction(
        params.id,
        replyId,
        commentValue,
        pathname
      );

      if (res.status === "7400") {
        setCommentValue("");
        setReplyId(null);
      }
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full items-start gap-2">
        <Link href={profilePath}>
          <UserProfileImg
            src={commentDetails.author.profileImage}
            userName={commentDetails.author.userName}
            className={`${isReply ? "size-[28px] min-h-[28px] min-w-[28px] rounded-md" : "size-[40px] min-h-[40px] min-w-[40px] rounded-xl"}`}
          />
        </Link>
        <div className="flex w-full flex-col gap-2">
          <div className="flex w-full items-start justify-between gap-2">
            <div className="flex w-full flex-col gap-1">
              <div
                className={`${isReply ? "text-[11px]" : "text-xs"} flex items-center gap-[2px] text-light-500`}
              >
                <Link href={profilePath} className="lowercase">
                  @{commentDetails.author.userName}
                </Link>
                <BsDot className={`${isReply ? "text-[11px]" : "text-xs"}`} />
                <p>{getFormattedDate(commentDetails.createdAt)}</p>
              </div>
              <p
                className={`${isReply ? "text-[11px]" : "text-[13px]"} text-light-900 first-letter:capitalize`}
              >
                {commentDetails.comment}
              </p>
              {canReply && (
                <div className="flex w-full items-center gap-5 text-light-500">
                  {/* Reply button */}
                  <span
                    className={`${
                      isReply ? "text-[11px]" : "text-xs"
                    } flex-center w-fit cursor-pointer gap-1 text-light-500 hover:text-light-900`}
                    onClick={() => {
                      handleReply?.(commentDetails._id, commentDetails.author);
                    }}
                  >
                    <Forward className={`${isReply ? "size-3" : "size-4"}`} />
                    Reply
                  </span>

                  {/* View / Hide replies */}
                  {commentDetails.totalReplies > 0 && (
                    <span
                      className={`${
                        isReply ? "text-[11px]" : "text-xs"
                      } cursor-pointer text-light-500 hover:text-light-900`}
                      onClick={handleViewReplies}
                    >
                      {isReplyOpen
                        ? "hide replies"
                        : `${commentDetails.totalReplies} replies`}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div
              className={`${isReply ? "mt-5" : "mt-6"} flex flex-col items-center gap-1`}
            >
              {isLiked ? (
                <Heart
                  className={`${isReply ? "size-3" : "size-4"} cursor-pointer fill-red-500 text-red-500`}
                  onClick={handleLike}
                />
              ) : (
                <Heart
                  className={`${isReply ? "size-3" : "size-4"} cursor-pointer text-light-500 hover:text-light-900`}
                  onClick={handleLike}
                />
              )}
              {totalLikes > 0 && (
                <p
                  className={`${isReply ? "text-[10px]" : "text-xs"} text-light-500`}
                >
                  {totalLikes}
                </p>
              )}
            </div>
          </div>
          {commentType === "PAGE" && replyId && (
            <Textarea
              ref={textAreaRef}
              placeholder={`${replyId ? "Reply" : "Add a Comment"}...`}
              className="max-h-[120px] min-h-[40px] resize-none rounded-xl border-2 border-solid border-dark-300 bg-dark-200 leading-5 text-light-900 outline-none ring-offset-dark-300 placeholder:text-light-500 focus:outline-dark-400 focus-visible:ring-1 focus-visible:ring-dark-400 focus-visible:ring-offset-1"
              value={commentValue}
              onChange={(e) => setCommentValue(e.target.value)}
            />
          )}
          {replyId && (
            <div className="flex w-full items-center justify-end gap-2">
              <p
                className="cursor-pointer text-xs text-light-600 hover:text-light-900"
                onClick={handleCancel}
              >
                Cancel
              </p>
              <Button
                className="flex h-6 gap-2 rounded-full border-none bg-primary-500 fill-light-900 px-3 text-[13px] text-light-900"
                disabled={!commentValue}
                onClick={handleSubmit}
              >
                <SendIcon width="14px" height="14px" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentCardBody;

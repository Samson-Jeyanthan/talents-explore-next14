"use client";

import { ICommentAuthor, IComments } from "@/types/post.types";
import { MotionDiv } from "../others/MotionDiv";
import CommentCardBody from "./CommentCardBody";
import React, { useState } from "react";
import { getRepliesOfCommentAction } from "@/actions/comment.action";
import { toast } from "sonner";

interface Prop {
  commentDetails: IComments;
  index: number;
  canReply?: boolean;
  handleIsReplyComment: (commentId: string, author: ICommentAuthor) => void;
  commentType: "PAGE" | "MODAL";
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const CommentCard = ({
  commentDetails,
  index,
  canReply,
  handleIsReplyComment,
  commentType,
}: Prop) => {
  const [replies, setReplies] = useState<IComments[]>([]);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);

  const handleViewReplies = async () => {
    if (isReplyOpen) {
      setIsReplyOpen(false);
      return;
    }

    try {
      setIsLoadingReplies(true);

      const res = await getRepliesOfCommentAction(
        commentDetails._id,
        1,
        20,
        "/home"
      );

      console.log("replies-view-res", res);

      if (res.status === "7400") {
        setReplies(res.response || []);
        setIsReplyOpen(true);
      } else {
        toast.error("Couldn't fetch replies", {
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("Error fetching replies:", error);

      toast.error("Couldn't fetch replies", {
        duration: 4000,
      });
    } finally {
      setIsLoadingReplies(false);
    }
  };

  return (
    <MotionDiv
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{
        delay: index * 0.15,
        ease: "easeInOut",
        duration: 0.3,
      }}
      viewport={{ amount: 0 }}
      className="flex items-start gap-2 p-2 pl-0"
    >
      <div className="flex w-full flex-col gap-2">
        <CommentCardBody
          commentDetails={commentDetails}
          canReply={canReply}
          handleViewReplies={handleViewReplies}
          handleIsReplyComment={handleIsReplyComment}
          commentType={commentType}
        />

        {isReplyOpen && (
          <div className="ml-12 mt-3 flex w-auto flex-col gap-3">
            {isLoadingReplies ? (
              <p className="text-xs text-light-500">Loading replies...</p>
            ) : (
              replies.map((reply) => (
                <CommentCardBody
                  key={reply._id}
                  isReply
                  commentDetails={reply}
                  canReply={canReply}
                  handleIsReplyComment={handleIsReplyComment}
                  commentType={commentType}
                />
              ))
            )}
          </div>
        )}
      </div>
    </MotionDiv>
  );
};

export default CommentCard;

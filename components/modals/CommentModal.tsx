"use client";

import { PostUtilsButton } from "../buttons";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "../ui/dialog";
import { useEffect, useState } from "react";
import { MdClose } from "react-icons/md";
import { toast } from "sonner";
import { CommentInput } from "../inputs";
import { CommentCard } from "../cards";
import { getCommentsAction } from "@/actions/comment.action";
import { ICommentAuthor, IComments } from "@/types/post.types";

const CommentModal = ({
  postId,
  numberOfComments,
  buttonClassName,
  canComment = true,
}: {
  postId: string;
  numberOfComments: number;
  buttonClassName?: string;
  canComment?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<IComments[]>([]);
  // const [replies, setReplies] = useState<IComments[]>([]);
  // const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyCommentId, setReplyCommentId] = useState<{
    commentId: string | null;
    author: ICommentAuthor | undefined;
  }>({
    commentId: null,
    author: undefined,
  });

  async function fetchCommentData() {
    try {
      const res = await getCommentsAction(postId, 1);
      if (res?.status === 200) {
        console.log(res?.response);
        setData(res?.response);
      } else {
        toast.error("Couldn't fetch comments ", { duration: 4000 });
        return false;
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchCommentData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleOnClose = () => {
    setReplyCommentId({ commentId: null, author: undefined });
    setIsOpen(false);
  };

  const handleIsReplyComment = async (
    commentId: string,
    author: ICommentAuthor
  ) => {
    console.log(commentId);
    setReplyCommentId({ commentId, author });
  };

  return (
    <Dialog open={isOpen}>
      <DialogTrigger onClick={() => setIsOpen(true)}>
        <PostUtilsButton
          buttonFor="COMMENT"
          className={buttonClassName}
          size="19px"
        />
      </DialogTrigger>
      <DialogContent
        className="connection-modal-content !rounded-2xl"
        aria-describedby={undefined}
      >
        <DialogTitle className="sticky top-0 w-full rounded-t-2xl border-b border-solid border-light-500/40 bg-dark-250 p-2 py-3 text-center text-xl font-medium text-light-850">
          {data.length} Comments
        </DialogTitle>
        <div className="flex w-full flex-col gap-3 overflow-y-scroll p-3 pb-16">
          {isLoading ? (
            "loading"
          ) : (
            <>
              {data?.map((item, index) => (
                <CommentCard
                  key={index}
                  commentDetails={item}
                  index={index}
                  canReply={canComment}
                  handleIsReplyComment={handleIsReplyComment}
                  commentType="MODAL"
                  // isReplyOpen={isReplyOpen}
                  // setIsReplyOpen={setIsReplyOpen}
                />
              ))}
            </>
          )}
        </div>

        <div className="flex-center fixed bottom-0 w-full gap-3 rounded-b-2xl pb-2">
          {canComment ? (
            <CommentInput
              postId={postId}
              commentType="MODAL"
              author={replyCommentId.author}
              replyCommentId={replyCommentId.commentId}
              setReplyCommentId={setReplyCommentId}
              setData={setData}
              // setIsReplyOpen={setIsReplyOpen}
            />
          ) : (
            <div className="border-t border-dark-300 bg-dark-250 px-4 py-3 text-sm text-light-500">
              Comments are private for your current visibility level.
            </div>
          )}
        </div>

        <DialogClose
          className="absolute -right-12 -top-8 cursor-pointer rounded-full bg-dark-250 p-[7px] text-light-900 focus:outline-none"
          onClick={handleOnClose}
        >
          <MdClose className="text-2xl" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default CommentModal;

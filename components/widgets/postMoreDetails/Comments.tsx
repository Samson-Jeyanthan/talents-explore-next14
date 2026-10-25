"use client";

import { getCommentsAction } from "@/actions/comment.action";
import { CommentCard } from "@/components/cards";
import { CommentInput } from "@/components/inputs";
import { ICommentAuthor, IComments } from "@/types/post.types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Props = {
  params: { id: string };
  numberOfComments: number;
  canComment?: boolean;
};

const Comments = ({ params, numberOfComments, canComment = true }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<IComments[]>([]);
  const [replyCommentId, setReplyCommentId] = useState<{
    commentId: string | null;
    author: ICommentAuthor | undefined;
  }>({
    commentId: null,
    author: undefined,
  });

  async function fetchCommentData() {
    try {
      const res = await getCommentsAction(params.id, 1);
      if (res?.status === 200) {
        console.log(res.response);
        setData(res.response);
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
    fetchCommentData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleIsReplyComment = async (
    commentId: string,
    author: ICommentAuthor
  ) => {
    console.log(commentId);
    setReplyCommentId({ commentId, author });
  };

  return (
    <section className="flex w-full flex-col gap-2">
      <h2 className="text-sm font-medium text-light-900">
        {numberOfComments} Comments
      </h2>
      {canComment ? (
        <CommentInput postId={params.id} commentType="PAGE" />
      ) : (
        <div className="rounded-2xl border border-dark-300 bg-dark-250 px-4 py-3 text-sm text-light-500">
          Comments are private for your current visibility level.
        </div>
      )}
      {data.length > 0 && (
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
                  commentType="PAGE"
                  // isReplyOpen={isReplyOpen}
                  // setIsReplyOpen={setIsReplyOpen}
                />
              ))}
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default Comments;

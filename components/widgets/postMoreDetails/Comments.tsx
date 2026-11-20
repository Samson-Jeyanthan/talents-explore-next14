"use client";

import CommentThread from "./CommentThread";

export default function Comments({
  params,
  numberOfComments,
  canComment = true,
  postAuthorId,
}: {
  params: { id: string };
  numberOfComments: number;
  canComment?: boolean;
  postAuthorId?: string;
}) {
  return (
    <CommentThread
      key={params.id}
      postId={params.id}
      numberOfComments={numberOfComments}
      canComment={canComment}
      postAuthorId={postAuthorId}
      commentType="PAGE"
    />
  );
}

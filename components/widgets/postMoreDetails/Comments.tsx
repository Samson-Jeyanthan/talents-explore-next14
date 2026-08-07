import { getPostCommentsAction } from "@/actions/post.action";
import { CommentInput } from "@/components/inputs";

type Props = {
  params: { id: string };
  numberOfComments: number;
  canComment?: boolean;
};

const Comments = async ({
  params,
  numberOfComments,
  canComment = true,
}: Props) => {
  const data = await getPostCommentsAction(params.id, "_", 1);
  if (data?.status === 400) return <p>Could not fetch comment data</p>;
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
      {data}
    </section>
  );
};

export default Comments;

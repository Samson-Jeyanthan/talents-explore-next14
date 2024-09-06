import { getPostCommentsAction } from "@/actions/post.action";
import { CommentInput } from "@/components/inputs";

type Props = {
  params: { id: string };
  numberOfComments: number;
};

const Comments = async ({ params, numberOfComments }: Props) => {
  const data = await getPostCommentsAction(params.id, " ");
  if (data?.status === 400) return <p>Could not fetch comment data</p>;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-light-900">
        {numberOfComments} Comments
      </h2>
      <CommentInput postId={params.id} commentType="PAGE" />
      {data}
    </section>
  );
};

export default Comments;

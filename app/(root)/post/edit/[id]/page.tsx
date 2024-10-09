import { getPostByIdAction } from "@/actions/post.action";
import { getSession } from "@/lib/session";
import { TPostProps } from "@/types/post.types";
import NotFound from "../../[id]/not-found";

const PostEdit = async ({ params }: { params: { id: string } }) => {
  const session = await getSession();
  const userId = session || "no_user";
  const data: TPostProps = await getPostByIdAction(params.id, userId);

  if (data?.status === 400) {
    return <NotFound />;
  }

  return <div>Edit Post</div>;
};

export default PostEdit;

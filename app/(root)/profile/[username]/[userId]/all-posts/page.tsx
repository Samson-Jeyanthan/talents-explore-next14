import { getUserAllPostsAction } from "@/actions/post.action";
import { getSession } from "@/lib/session";
import { TProfileURLProps } from "@/types/utils.types";
import AlertNote from "@/components/others/AlertNote";

async function AllPosts({ params }: TProfileURLProps) {
  const token = await getSession();
  const data = await getUserAllPostsAction(params.userId, token, 1, 5);

  if (data?.status === 400) {
    return <AlertNote />;
  }

  return (
    <section className="my-8 flex flex-col gap-4">
      {data.length > 0 ? data : <p className="text-light-900">NO DATA FOUND</p>}
    </section>
  );
}

export default AllPosts;

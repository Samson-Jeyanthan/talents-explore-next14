import { getUserAllPosts } from "@/actions/post.action";
import { ProfileURLProps } from "../layout";
import { getSession } from "@/lib/session";

async function AllPosts({ params }: ProfileURLProps) {
  const token = await getSession();
  const data = await getUserAllPosts(params.userId, token, 1, 5);
  return <section className="my-8 flex flex-col gap-4">{data}</section>;
}

export default AllPosts;

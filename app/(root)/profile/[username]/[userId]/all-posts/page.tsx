import { getUserAllPosts } from "@/actions/post.action";

async function AllPosts() {
  const data = await getUserAllPosts(
    "657160e126fd60915f674078",
    "657160e126fd60915f674078",
    1,
    5
  );
  return <section className="my-8 flex flex-col gap-4">{data}</section>;
}

export default AllPosts;

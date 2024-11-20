import { getAllPostsAction } from "@/actions/post.action";
import { RightSidebar } from "@/components/widgets";
import { getSession } from "@/lib/session";

async function Home() {
  const token = await getSession();
  const data = await getAllPostsAction(token, 1, 10);

  if (data.status === 400) {
    return <div>{data.message}</div>;
  }

  return (
    <section className="flex w-full items-start justify-between gap-2">
      <div className="flex-center w-full pt-8">
        <div className="flex w-[36rem] flex-col gap-4 pb-8">{data}</div>
      </div>
      <RightSidebar />
    </section>
  );
}

export default Home;

import { getAllPostsAction } from "@/actions/post.action";
import { RightSidebar } from "@/components/widgets";
import { getSession } from "@/lib/session";

async function Home() {
  const token = await getSession();
  const data = await getAllPostsAction(token, 1, 10);

  if (!Array.isArray(data)) {
    return (
      <section className="flex w-full items-start justify-between gap-2">
        <div className="flex-center w-full pt-8">
          <div className="w-[36rem] rounded-[28px] border-2 border-dark-300 bg-dark-250 p-6 text-sm text-light-700">
            {data.message}
          </div>
        </div>
        <RightSidebar />
      </section>
    );
  }

  if (data.length === 0) {
    return (
      <section className="flex w-full items-start justify-between gap-2">
        <div className="flex-center w-full pt-8">
          <div className="w-[36rem] rounded-[28px] border-2 border-dark-300 bg-dark-250 p-6 text-sm text-light-700">
            No posts found in your home feed yet.
          </div>
        </div>
        <RightSidebar />
      </section>
    );
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

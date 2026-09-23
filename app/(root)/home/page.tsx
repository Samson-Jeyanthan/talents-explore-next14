import React from "react";
import { getAllPostsAction } from "@/actions/post.action";
import { RightSidebar } from "@/components/widgets";
import { redirect } from "next/navigation";

function FeedShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex w-full min-w-0 items-start justify-between gap-2 overflow-x-clip">
      <div className="flex-center w-full min-w-0 px-3 pt-8 sm:px-4">{children}</div>
      <RightSidebar />
    </section>
  );
}

function FeedMessage({ message }: { message: string }) {
  return (
    <div className="w-full max-w-[36rem] rounded-[28px] border-2 border-dark-300 bg-dark-250 p-6 text-sm text-light-700">
      {message}
    </div>
  );
}

export default async function Home() {
  const data = await getAllPostsAction(1, 10);

  if (!Array.isArray(data)) {
    if (data.status === 401) {
      redirect("/sign-in");
    }

    return (
      <FeedShell>
        <FeedMessage message={data.message} />
      </FeedShell>
    );
  }

  if (data.length === 0) {
    return (
      <FeedShell>
        <FeedMessage message="No posts found in your home feed yet." />
      </FeedShell>
    );
  }

  return (
    <FeedShell>
      <div className="flex w-full max-w-[36rem] flex-col gap-4 pb-8">{data}</div>
    </FeedShell>
  );
}

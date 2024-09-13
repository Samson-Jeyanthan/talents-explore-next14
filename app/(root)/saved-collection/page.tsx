import { getAllSavedFoldersAction } from "@/actions/save.action";
import { getSession } from "@/lib/session";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Collection | Talents Explore",
  description: "Saved Collection | Talents Explore",
};

const SavedCollection = async () => {
  const session = await getSession();
  const data = await getAllSavedFoldersAction(session, 0);
  if (data.status === 400) return null;

  return (
    <section className="mt-8 flex w-full flex-col gap-8">
      <h1 className="text-3xl font-semibold text-light-900">
        Saved Collection
      </h1>
      {data?.length === 0 ? (
        <p>No folders have been create {data?.length}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4">
          {data}
        </div>
      )}
    </section>
  );
};

export default SavedCollection;

// <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">

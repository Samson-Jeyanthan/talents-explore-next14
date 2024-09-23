import { getAllSavedFoldersAction } from "@/actions/save.action";
import { CreateSaveFolder } from "@/components/buttons";
import { getSession } from "@/lib/session";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Collection | Talents Explore",
  description: "Saved Collection | Talents Explore",
};

const SavedCollection = async () => {
  const session = await getSession();
  const data = await getAllSavedFoldersAction(session, 0, true);
  if (data.status === 400) return null;

  return (
    <section className="mt-8 flex w-full flex-col gap-8">
      <h1 className="flex-between text-3xl font-semibold text-light-900">
        Saved Collection
        <CreateSaveFolder />
      </h1>
      {data?.length === 0 ? (
        <p>No folders have been create {data?.length}</p>
      ) : (
        <div
          className="
          saved-collection-container
        
        "
        >
          {data}
        </div>
      )}
    </section>
  );
};

export default SavedCollection;

// <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">

// w-full columns-1 gap-x-3 sm:columns-2 md:columns-3 xl:columns-4

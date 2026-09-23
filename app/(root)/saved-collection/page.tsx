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
  const data = await getAllSavedFoldersAction({
    userId: session,
    postId: 0,
    returnAsCard: true,
  });
  if (data.status === 400) return null;

  return (
    <section className="mt-4 flex w-full min-w-0 flex-col gap-8 p-4 sm:p-8 sm:px-10 2xl:max-w-[1600px]">
      <h1 className="flex flex-col gap-1 text-2xl font-semibold text-light-900 md:flex-row md:items-center md:justify-between md:text-3xl">
        Saved Collection
        <CreateSaveFolder />
      </h1>
      {data?.length === 0 ? (
        <p>No folders have been create {data?.length}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5">
          {data}
        </div>
      )}
    </section>
  );
};

export default SavedCollection;

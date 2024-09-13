import { getSavedItemsByFolderIdAction } from "@/actions/save.action";
import { getSession } from "@/lib/session";
// import { Metadata, ResolvingMetadata } from "next";

const SavedFolder = async ({
  params,
}: {
  params: { collectionName: string; id: string };
}) => {
  const session = await getSession();
  const data = await getSavedItemsByFolderIdAction(
    params.id,
    session,
    1,
    10,
    true
  );

  return (
    <section className="mt-8 flex w-full flex-col gap-8">
      <h1 className="text-3xl font-semibold text-light-900">
        Saved Collection
      </h1>
      <div className="w-full max-w-screen-xl columns-1 gap-x-4 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 xl:gap-x-6">
        {data}
      </div>
    </section>
  );
};

export default SavedFolder;

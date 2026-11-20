import { getSavedFoldersAction } from "@/actions/save.action";
import { CreateSaveFolder } from "@/components/buttons";
import SavedFolderCard from "@/components/cards/SavedFolderCard";
import RetrySavedCollection from "@/components/widgets/savedCollections/RetrySavedCollection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Collections | Talents Explore",
};
export default async function SavedCollection() {
  const result = await getSavedFoldersAction();
  return (
    <section className="mt-4 flex w-full min-w-0 flex-col gap-6 p-4 sm:p-8 sm:px-10 2xl:max-w-[1600px]">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-light-900">
          Saved collections
        </h1>
        <CreateSaveFolder />
      </header>
      {!result.success ? (
        <div
          role="alert"
          className="rounded-2xl border border-dark-400 bg-dark-250 p-4 text-sm text-light-700"
        >
          <p>{result.message}</p>
          <RetrySavedCollection />
        </div>
      ) : !result.data.length ? (
        <p className="text-sm text-light-500">
          No collections yet. Create one to organize saved posts.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {result.data
            .slice()
            .reverse()
            .map((folder, index) => (
              <SavedFolderCard
                key={folder._id}
                folderCard={folder}
                index={index}
              />
            ))}
        </div>
      )}
    </section>
  );
}

import {
  getSavedFoldersAction,
  getSavedItemsAction,
} from "@/actions/save.action";
import { isCollectionId } from "@/lib/utils/savedCollections";
import SavedCollectionItems from "@/components/widgets/savedCollections/SavedCollectionItems";
import RetrySavedCollection from "@/components/widgets/savedCollections/RetrySavedCollection";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SavedFolder({
  params,
}: {
  params: { id: string };
}) {
  if (!isCollectionId(params.id)) notFound();
  const [folders, items] = await Promise.all([
    getSavedFoldersAction(),
    getSavedItemsAction(params.id, 1, 20),
  ]);
  const folder = folders.success
    ? folders.data.find((item) => item._id === params.id)
    : undefined;
  if (folders.success && !folder) notFound();
  return (
    <section className="mt-4 flex w-full min-w-0 flex-col gap-6 p-4 sm:p-8 sm:px-10 2xl:max-w-[1600px]">
      <Link
        href="/saved-collection"
        className="w-fit text-sm text-light-500 hover:text-light-900"
      >
        Back to saved collections
      </Link>
      <h1 className="break-words text-2xl font-semibold text-light-900">
        {folder?.collectionName || "Saved collection"}
      </h1>
      {!folders.success && (
        <p className="text-sm text-light-500">
          The collection name is temporarily unavailable.
        </p>
      )}
      {items.success ? (
        <SavedCollectionItems
          key={params.id}
          folderId={params.id}
          initialItems={items.data}
        />
      ) : (
        <div
          role="alert"
          className="rounded-2xl border border-dark-400 bg-dark-250 p-4 text-sm text-light-700"
        >
          <p>{items.message}</p>
          <RetrySavedCollection />
        </div>
      )}
    </section>
  );
}

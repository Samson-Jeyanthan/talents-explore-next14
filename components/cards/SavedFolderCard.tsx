import type { ISavedFolder } from "@/types/post.types";
import { MotionDiv } from "../others/MotionDiv";
import { getSavedItemsAction } from "@/actions/save.action";
import Image from "next/image";
import Link from "next/link";
import { SaveFolderOptions } from "../options";

export default async function SavedFolderCard({
  folderCard,
  index,
}: {
  folderCard: ISavedFolder;
  userId?: string;
  index: number;
}) {
  const result = await getSavedItemsAction(folderCard._id, 1, 2);
  const media = result.success ? result.data[0]?.media?.[0] : undefined;
  const thumbnail =
    (media?.mediaType === "image" ? media.url : media?.thumbnailUrl) ||
    "/assets/images/default-save-folder.png";
  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="relative mb-5 h-[130px] w-full min-w-0 rounded-3xl border border-dark-300"
    >
      <Link
        href={`/saved-collection/${folderCard._id}`}
        className="flex size-full items-center gap-3 rounded-3xl bg-dark-250 p-3"
      >
        <Image
          src={thumbnail}
          width={160}
          height={160}
          alt=""
          className="size-20 min-w-20 rounded-xl object-cover"
        />
        <div className="min-w-0 pr-5">
          <h2 className="break-words text-sm font-medium text-light-900">
            {folderCard.collectionName}
          </h2>
          {!result.success && (
            <p className="mt-1 text-xs text-light-500">Preview unavailable</p>
          )}
        </div>
      </Link>
      <div className="absolute right-2 top-2">
        <SaveFolderOptions
          folderId={folderCard._id}
          folderName={folderCard.collectionName}
        />
      </div>
    </MotionDiv>
  );
}

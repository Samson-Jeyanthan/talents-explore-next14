import { ISavedFolder, ISavedItem } from "@/types/post.types";
import { MotionDiv } from "../others/MotionDiv";
import { getSavedItemsByFolderIdAction } from "@/actions/save.action";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { SaveFolderOptions } from "../options";

interface Props {
  folderCard: ISavedFolder;
  userId: string | undefined;
  index: number;
}

const variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

async function SavedFolderCard({ folderCard, userId, index }: Props) {
  const itemsOfFolder: ISavedItem[] = await getSavedItemsByFolderIdAction(
    folderCard._id,
    userId,
    1,
    2,
    false
  );

  const media = itemsOfFolder[0]?.media[0];
  const mediaUrl = media?.url || media?.thumbnailUrl || "";

  return (
    <MotionDiv
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{
        delay: index * 0.08,
        ease: "easeInOut",
        duration: 0.2,
      }}
      viewport={{ amount: 0 }}
      className="flex-center relative z-10 mb-5 h-[130px] w-full min-w-[250px] max-w-full rounded-3xl border border-solid border-dark-300 2xl:max-w-[300px]"
    >
      <Link
        href={`/saved-collection/${folderCard._id}`}
        className="z-10 flex size-full items-center justify-start gap-3 rounded-3xl bg-dark-200/85 p-3 backdrop-blur-2xl 2xl:max-w-[300px]"
      >
        <Image
          src={
            itemsOfFolder[0]?.media[0]?.mediaType === "image"
              ? mediaUrl
              : "/assets/images/sample-post-img.jpg"
          }
          width={512}
          height={512}
          alt={folderCard.collectionName}
          className="h-full w-[5.5rem] rounded-xl object-cover"
        />

        <h2 className="px-1 text-sm font-medium text-light-900 first-letter:capitalize xl:text-lg">
          {folderCard.collectionName}
        </h2>
      </Link>

      <Image
        src={
          itemsOfFolder[0]?.media[0]?.mediaType === "image"
            ? mediaUrl
            : "/assets/images/save-folder-default-bg.png"
        }
        width={512}
        height={512}
        alt={folderCard.collectionName}
        className="absolute left-0 top-0 z-0 h-[125px] w-full rounded-3xl object-cover"
      />

      <div className="absolute right-2 top-0 z-20">
        <SaveFolderOptions
          folderId={folderCard._id}
          folderName={folderCard.collectionName}
        />
      </div>
    </MotionDiv>
  );
}

export default SavedFolderCard;

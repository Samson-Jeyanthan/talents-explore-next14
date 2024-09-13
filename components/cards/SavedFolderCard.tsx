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
  const isImage = media?.mediaType === "image";
  const mediaUrl = media?.url || media?.thumbnailUrl || "";

  return (
    <MotionDiv
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={{
        delay: index * 0.15,
        ease: "easeInOut",
        duration: 0.3,
      }}
      viewport={{ amount: 0 }}
      className="flex-center relative z-10 h-[138px] w-full rounded-3xl border border-solid border-dark-300"
    >
      <Link
        href={
          "/saved-collection/" +
          folderCard.collectionName +
          "/" +
          folderCard._id
        }
        className="z-10 flex size-full items-center justify-start gap-4 rounded-3xl bg-dark-200/85 p-3 px-2 backdrop-blur-[80px]"
      >
        <div className="relative flex h-[120px] w-[110px] items-start justify-start">
          {itemsOfFolder.map((folderItem, folderIndex) => {
            return (
              <React.Fragment key={folderIndex}>
                {folderItem.media.map((item, index) => {
                  const isMediaImage = item.mediaType === "image";
                  return (
                    index === 0 && (
                      <React.Fragment key={index}>
                        {isMediaImage ? (
                          <Image
                            src={
                              item.url
                                ? item.url
                                : "/assets/images/sample-post-img.jpg"
                            }
                            width={512}
                            height={512}
                            alt={folderCard.collectionName}
                            className={`${itemsOfFolder.length === 1 ? "scf-image-scale" : folderIndex === 1 ? "scf-back-image" : "scf-front-image"} `}
                          />
                        ) : (
                          <Image
                            src="/assets/images/sample-profile-cover-photo.jpg"
                            width={512}
                            height={512}
                            alt={folderCard.collectionName}
                            className={`${itemsOfFolder.length <= 1 ? "scf-image-scale" : folderIndex === 1 ? "scf-back-image" : "scf-front-image"}`}
                          />
                        )}
                      </React.Fragment>
                    )
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>

        <h2 className="text-lg font-medium text-light-900 first-letter:capitalize">
          {folderCard.collectionName}
        </h2>
      </Link>

      {itemsOfFolder[0]?.media.length > 0 && isImage ? (
        <Image
          src={mediaUrl}
          width={512}
          height={512}
          alt={folderCard.collectionName}
          className="scf-bg-blur-image"
        />
      ) : (
        <Image
          src={"/assets/images/save-folder-default-bg.png"}
          width={512}
          height={512}
          alt={folderCard.collectionName}
          className="scf-bg-blur-image"
        />
      )}
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

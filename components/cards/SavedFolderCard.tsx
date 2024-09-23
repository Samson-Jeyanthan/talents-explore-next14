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
      className="flex-center relative z-10 mb-5 h-[140px] w-full min-w-[250px] max-w-full rounded-3xl border border-solid border-dark-300 2xl:max-w-[300px]"
    >
      <Link
        href={
          "/saved-collection/" +
          folderCard.collectionName +
          "/" +
          folderCard._id
        }
        className="z-10 flex h-[140px] w-full items-center justify-start gap-3 rounded-3xl bg-dark-200/85 p-3 backdrop-blur-[80px] 2xl:max-w-[300px]"
      >
        <div className="relative flex h-[140px] w-[100px] items-center justify-center py-3">
          {itemsOfFolder.length === 0 ? (
            <div className="scf-image-scale bg-dark-200" />
          ) : null}
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

        <h2 className="max-w-[180px] text-sm font-medium text-light-900 first-letter:capitalize lg:text-base xl:text-lg">
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

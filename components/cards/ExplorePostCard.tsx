"use client";

import Link from "next/link";
import Image from "next/image";
import UserProfileImg from "../others/UserProfileImg";
import { exploreThumbnail, type ExploreItem } from "@/lib/utils/explore";
import { displayRating } from "@/lib/utils/ratings";
import { StarIcon } from "@/public/assets/svgs";

export default function ExplorePostCard({
  postCard: item,
}: {
  postCard: ExploreItem;
  index: number;
}) {
  const media = Array.isArray(item.media) ? item.media[0] : item.media;
  const shared =
    item.type === "SHARELINK" ||
    media?.type === "SHARELINK" ||
    !!item.website ||
    !!item.shareLinkThumbnail;
  const author = item.author || {};
  const name =
    typeof author.userName === "string" ? author.userName : "Unknown user";
  const title =
    typeof item.about?.title === "string" && item.about.title.trim()
      ? item.about.title
      : shared
        ? "Shared link"
        : "Untitled post";
  const authorPath =
    typeof author._id === "string" && /^[a-f\d]{24}$/i.test(author._id)
      ? `/profile/${encodeURIComponent(name)}/${author._id}`
      : undefined;
  return (
    <article className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-dark-400/50 bg-dark-250">
      <Link
        href={`/post/${item._id}`}
        className="relative block h-48 w-full sm:h-56"
        aria-label={title}
      >
        <Image
          unoptimized
          src={exploreThumbnail(item)}
          alt={title}
          width={512}
          height={512}
          className="size-full object-cover"
          onError={(event) => {
            const image = event.currentTarget;
            if (!image.src.endsWith("/assets/images/default-save-folder.png"))
              image.src = "/assets/images/default-save-folder.png";
          }}
        />
        <span className="absolute left-2 top-2 rounded-full bg-dark-250/90 px-2 py-1 text-xs text-light-900">
          {shared
            ? "Shared link"
            : media?.mediaType === "video"
              ? "Video"
              : "Post"}
        </span>
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-dark-250/90 fill-custom-100 px-2 py-1 text-xs text-light-900">
          <StarIcon width="12px" height="12px" />
          {displayRating(item.postRating).toFixed(1)}
        </span>
      </Link>
      <div className="flex min-w-0 flex-col gap-2 p-3">
        <Link
          href={`/post/${item._id}`}
          className="line-clamp-2 break-words text-sm font-medium text-light-900"
        >
          {title}
        </Link>
        {authorPath ? (
          <Link
            href={authorPath}
            className="flex min-w-0 items-center gap-2 text-xs text-light-600"
          >
            <UserProfileImg
              userName={name}
              src={
                typeof author.profileImage === "string"
                  ? author.profileImage
                  : undefined
              }
              className="!size-6 !min-h-6 !min-w-6"
            />
            <span className="truncate">@{name}</span>
          </Link>
        ) : (
          <p className="text-xs text-light-500">{name}</p>
        )}
      </div>
    </article>
  );
}

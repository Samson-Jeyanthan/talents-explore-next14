import Link from "next/link";
import UserProfileImg from "../others/UserProfileImg";
import { StarIcon } from "@/public/assets/svgs";
import { displayRating } from "@/lib/utils/ratings";
import type { IExploreTalentsProps } from "@/types/utils.types";

export default function AllTalentsCard({
  allTalentsCard: item,
}: {
  allTalentsCard: IExploreTalentsProps;
  index: number;
}) {
  const name = typeof item.userName === "string" ? item.userName : "user";
  const professional =
    typeof item.professional === "string"
      ? item.professional
      : typeof (item.professional as any)?.professional === "string"
        ? (item.professional as any).professional
        : "";
  return (
    <Link
      href={`/profile/${encodeURIComponent(name)}/${item._id}`}
      className="flex w-full min-w-0 flex-col items-center gap-2 rounded-2xl border border-dark-400/50 bg-dark-250 p-4 text-center"
    >
      <UserProfileImg
        src={
          typeof item.profileImage === "string" ? item.profileImage : undefined
        }
        userName={name}
        className="!size-16 !min-h-16 !min-w-16 rounded-full"
      />
      <p className="w-full break-all text-sm text-light-900">@{name}</p>
      {professional && (
        <p className="break-words text-xs text-light-600">{professional}</p>
      )}
      <p className="flex items-center gap-1 fill-custom-100 text-sm text-light-900">
        <StarIcon width="14px" height="14px" />
        {displayRating(item.avgRating).toFixed(1)}
      </p>
      <p className="text-xs text-light-500">
        {typeof item.numberOfRating === "number" &&
        Number.isFinite(item.numberOfRating)
          ? item.numberOfRating
          : 0}{" "}
        ratings
      </p>
    </Link>
  );
}

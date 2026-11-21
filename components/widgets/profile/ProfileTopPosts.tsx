"use client";
import { getProfileTopPostsAction } from "@/actions/profile-overview.action";
import { useProfileSectionRead } from "@/lib/hooks/useProfileSectionRead";
import type { ProfileSectionResult } from "@/lib/utils/profile-sections";
import type { ITopPost } from "@/types/profile.types";
import TopPostsCarousel from "@/components/widgets/carousels/TopPostsCarousel";
import PostIcon from "@/public/assets/svgs/PostIcon";
import { Button } from "@/components/ui/button";

export default function ProfileTopPosts({
  profileId,
  isOwnProfile,
  initialResult,
}: {
  profileId: string;
  isOwnProfile: boolean;
  initialResult: ProfileSectionResult<ITopPost>;
}) {
  const { result, pending, retry } = useProfileSectionRead(
    profileId,
    initialResult,
    getProfileTopPostsAction,
    "Unable to load Top Posts. Please try again.",
  );
  if (result.status === "7400" && !isOwnProfile && !result.response.length)
    return null;
  return (
    <section
      className={
        result.status === "7400" && result.response.length
          ? "flex w-full min-w-0 max-w-[95%] flex-col gap-3"
          : "flex w-full min-w-0 flex-col gap-3"
      }
      aria-busy={pending}
    >
      <div className="profile-detail-heading w-full sm:w-1/2">
        <PostIcon width="21px" height="21px" /> Top Posts
      </div>
      {result.status === "private" ? (
        <p className="text-sm text-light-700">{result.message}</p>
      ) : result.status === "400" ? (
        <div
          role="alert"
          className="rounded-2xl border border-dark-400 bg-dark-250 p-4 text-sm text-light-700"
        >
          <p>{result.message}</p>
          <Button type="button" disabled={pending} onClick={retry}>
            {pending ? "Loading..." : "Try again"}
          </Button>
        </div>
      ) : result.response.length ? (
        <TopPostsCarousel
          slides={result.response}
          length={result.response.length}
        />
      ) : (
        <p className="text-center">No posts yet</p>
      )}
    </section>
  );
}

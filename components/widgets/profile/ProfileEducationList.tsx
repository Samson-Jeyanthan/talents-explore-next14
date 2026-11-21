"use client";
import { getProfileEducationsAction } from "@/actions/profile-education.action";
import {
  educationKey,
  type ProfileEducation,
} from "@/lib/utils/profile-education";
import { useProfileSectionRead } from "@/lib/hooks/useProfileSectionRead";
import type { ProfileSectionResult } from "@/lib/utils/profile-sections";
import { ProInfoAddBtn } from "@/components/buttons";
import { EducationCard } from "@/components/cards/ProDetailCards";
import { Button } from "@/components/ui/button";
import GraduationIcon from "@/public/assets/svgs/GraduationIcon";
import EmptyDetails from "@/components/others/EmptyDetails";

export default function ProfileEducationList({
  profileId,
  isOwnProfile,
  initialResult,
}: {
  profileId: string;
  isOwnProfile: boolean;
  initialResult: ProfileSectionResult<ProfileEducation>;
}) {
  const state = useProfileSectionRead(
    profileId,
    initialResult,
    getProfileEducationsAction,
    "Unable to load education details. Please try again.",
  );
  return (
    <ProfileEducationSection
      isOwnProfile={isOwnProfile}
      result={state.result}
      loading={state.pending}
      retry={state.retry}
    />
  );
}
export function ProfileEducationSection({
  isOwnProfile,
  result,
  loading,
  retry,
}: {
  isOwnProfile: boolean;
  result: ProfileSectionResult<ProfileEducation>;
  loading: boolean;
  retry: () => Promise<void>;
}) {
  if (result.status === "7400" && !isOwnProfile && !result.response.length)
    return null;
  return (
    <article className="flex w-full min-w-0 max-w-[22rem] flex-col gap-4">
      <h4 className="flex-between w-full text-sm">
        Education
        {isOwnProfile && result.status === "7400" ? (
          <ProInfoAddBtn detailName="education" dataArray={result.response} />
        ) : null}
      </h4>
      {result.status === "private" ? (
        <p className="text-sm text-light-700">{result.message}</p>
      ) : result.status !== "7400" ? (
        <div
          role="alert"
          className="rounded-2xl border border-dark-400 bg-dark-250 p-4 text-sm text-light-700"
        >
          <p>{result.message}</p>
          <Button type="button" disabled={loading} onClick={retry}>
            {loading ? "Loading..." : "Try again"}
          </Button>
        </div>
      ) : result.response.length ? (
        <div className="flex flex-col rounded-2xl border-2 border-dark-400 bg-dark-300/70 p-2">
          {result.response.map((row, index) => (
            <EducationCard
              key={educationKey(row)}
              data={row}
              index={index}
              length={result.response.length}
              dataArray={result.response}
            />
          ))}
        </div>
      ) : (
        <div className="pt-6">
          <EmptyDetails
            Icon={GraduationIcon}
            text="You have not added any education yet"
            size="56px"
          />
        </div>
      )}
    </article>
  );
}

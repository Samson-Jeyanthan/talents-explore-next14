"use client";
import { getProfileLanguagesAction } from "@/actions/profile-overview.action";
import { getProfileEducationsAction } from "@/actions/profile-education.action";
import { useProfileSectionRead } from "@/lib/hooks/useProfileSectionRead";
import type { ProfileSectionResult } from "@/lib/utils/profile-sections";
import type { ProfileEducation } from "@/lib/utils/profile-education";
import type { ILanguage } from "@/types/profile.types";
import { LanguageCard } from "@/components/cards/ProDetailCards";
import { ProInfoAddBtn } from "@/components/buttons";
import { ProfileEducationSection } from "./ProfileEducationList";
import EmptyDetails from "@/components/others/EmptyDetails";
import LanguageIcon from "@/public/assets/svgs/LanguageIcon";
import GraduationIcon from "@/public/assets/svgs/GraduationIcon";
import { Button } from "@/components/ui/button";

export default function ProfileLanguageEducation({
  profileId,
  isOwnProfile,
  initialLanguages,
  initialEducation,
}: {
  profileId: string;
  isOwnProfile: boolean;
  initialLanguages: ProfileSectionResult<ILanguage>;
  initialEducation: ProfileSectionResult<ProfileEducation>;
}) {
  const languages = useProfileSectionRead(
    profileId,
    initialLanguages,
    getProfileLanguagesAction,
    "Unable to load languages. Please try again.",
  );
  const education = useProfileSectionRead(
    profileId,
    initialEducation,
    getProfileEducationsAction,
    "Unable to load education details. Please try again.",
  );
  if (languages.result.status === "private")
    return <p className="text-sm text-light-700">{languages.result.message}</p>;
  if (education.result.status === "private")
    return <p className="text-sm text-light-700">{education.result.message}</p>;
  if (
    !isOwnProfile &&
    languages.result.status === "7400" &&
    education.result.status === "7400" &&
    !languages.result.response.length &&
    !education.result.response.length
  )
    return null;
  const result = languages.result;
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="profile-detail-heading w-full sm:w-1/2">
        <GraduationIcon /> Languages &amp; Education
      </div>
      <div className="flex w-full flex-col items-start justify-between gap-6 sm:flex-row">
        {result.status !== "7400" || isOwnProfile || result.response.length ? (
          <article
            className="flex w-full max-w-[22rem] flex-col gap-4"
            aria-busy={languages.pending}
          >
            <h4 className="flex-between w-full text-sm">
              Known Languages
              {isOwnProfile && result.status === "7400" ? (
                <ProInfoAddBtn
                  detailName="language"
                  dataArray={result.response}
                />
              ) : null}
            </h4>
            {result.status === "private" ? (
              <p className="text-sm text-light-700">{result.message}</p>
            ) : result.status === "400" ? (
              <div
                role="alert"
                className="rounded-2xl border border-dark-400 bg-dark-250 p-4 text-sm text-light-700"
              >
                <p>{result.message}</p>
                <Button
                  type="button"
                  disabled={languages.pending}
                  onClick={languages.retry}
                >
                  {languages.pending ? "Loading..." : "Try again"}
                </Button>
              </div>
            ) : result.response.length ? (
              <div className="flex flex-col rounded-2xl border-2 border-dark-400 bg-dark-300/70 p-2">
                {result.response.map((row, index) => (
                  <LanguageCard
                    key={row._id}
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
                  Icon={LanguageIcon}
                  text="You have not added any languages yet"
                  size="52px"
                />
              </div>
            )}
          </article>
        ) : null}
        <ProfileEducationSection
          isOwnProfile={isOwnProfile}
          result={education.result}
          loading={education.pending}
          retry={education.retry}
        />
      </div>
    </div>
  );
}

import { getProfileEducationsAction } from "@/actions/profile-education.action";
import ProfileEducationList from "./ProfileEducationList";
import { getUserLanguageInfoAction } from "@/actions/user.action";
import { ProInfoAddBtn } from "@/components/buttons";
import { LanguageCard } from "@/components/cards/ProDetailCards";
import { EmptyDetails } from "@/components/others";
import { getCurrentUserId } from "@/lib/session";
import { GraduationIcon, LanguageIcon } from "@/public/assets/svgs";
import { ILanguage } from "@/types/profile.types";
import { TProfileURLProps } from "@/types/utils.types";

const LanguageEducationDetails = async ({ params }: TProfileURLProps) => {
  const currentUserId = await getCurrentUserId();
  const isOwnProfile = currentUserId === params.userId;

  const languageResult = await getUserLanguageInfoAction(params.userId);
  const languageData = Array.isArray(languageResult) ? languageResult : [];

  const educationResult = await getProfileEducationsAction(params.userId);

  if (
    !isOwnProfile &&
    languageData.length === 0 &&
    educationResult.status === "7400" &&
    educationResult.response.length === 0
  ) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="profile-detail-heading w-full sm:w-1/2">
        <GraduationIcon /> Languages & Education
      </div>

      <div className="flex w-full flex-col items-start justify-between gap-6 sm:flex-row">
        {languageData.length > 0 ? (
          <article className="flex w-full max-w-[22rem] flex-col gap-4">
            <h4 className="flex-between w-full text-sm">
              Known Languages
              {isOwnProfile && (
                <ProInfoAddBtn detailName="language" dataArray={languageData} />
              )}
            </h4>
            {languageData.length > 0 ? (
              <div className="flex flex-col rounded-2xl border-2 border-dark-400 bg-dark-300/70 p-2">
                {languageData.map((item: ILanguage, index: number) => (
                  <LanguageCard
                    key={item._id}
                    index={index}
                    data={item}
                    length={languageData.length}
                    dataArray={languageData}
                  />
                ))}
              </div>
            ) : (
              <>{isOwnProfile && <div>No languages added</div>}</>
            )}
          </article>
        ) : (
          isOwnProfile && (
            <article className="flex w-full max-w-[22rem] flex-col gap-4">
              <h4 className="flex-between w-full text-sm">
                Known Languages
                <ProInfoAddBtn detailName="language" dataArray={languageData} />
              </h4>
              <div className="pt-6">
                <EmptyDetails
                  Icon={LanguageIcon}
                  text="You have not added any languages yet"
                  size="52px"
                />
              </div>
            </article>
          )
        )}

        <ProfileEducationList
          profileId={params.userId}
          isOwnProfile={isOwnProfile}
          initialResult={educationResult}
        />
      </div>
    </div>
  );
};

export default LanguageEducationDetails;

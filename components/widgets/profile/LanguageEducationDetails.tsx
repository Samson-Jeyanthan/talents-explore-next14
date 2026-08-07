import {
  userEducationInfoAction,
  userLanguageInfoAction,
} from "@/actions/user.action";
import { ProInfoAddBtn } from "@/components/buttons";
import { LanguageCard } from "@/components/cards/ProDetailCards";
import { LangDetailModal } from "@/components/modals";
import { GraduationIcon } from "@/public/assets/svgs";
import { ILanguage } from "@/types/profile.types";
import { TProfileURLProps } from "@/types/utils.types";

const LanguageEducationDetails = async ({ params }: TProfileURLProps) => {
  const languageData = await userLanguageInfoAction({
    userId: params.userId,
  });
  if (languageData?.status === 400) return null;

  const educationData = await userEducationInfoAction(params.userId);
  if (educationData?.status === 400) return null;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="profile-detail-heading w-1/2">
        <GraduationIcon /> Languages & Education
      </div>

      <div className="flex w-full items-start justify-between gap-6">
        <article className="flex w-full max-w-[22rem] flex-col gap-4">
          <h4 className="flex-between w-full text-sm">
            Known Languages
            <LangDetailModal isEdit={false} />
          </h4>
          <div className="flex flex-col rounded-2xl border-2 border-dark-400 bg-dark-300/70 p-2">
            {languageData.map((item: ILanguage, index: number) => (
              <LanguageCard
                key={item._id}
                userLangCard={item}
                index={index}
                length={languageData.length}
              />
            ))}
          </div>
        </article>

        <article className="flex w-full max-w-[22rem] flex-col gap-4">
          <h4 className="flex-between w-full text-sm">
            Education
            <ProInfoAddBtn detailName="education" dataArray={educationData} />
          </h4>
          <div className="flex flex-col rounded-2xl border-2 border-dark-400 bg-dark-300/70 p-2">
            {educationData}
          </div>
        </article>
      </div>
    </div>
  );
};

export default LanguageEducationDetails;

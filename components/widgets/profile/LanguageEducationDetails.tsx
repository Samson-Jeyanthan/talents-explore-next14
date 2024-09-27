import {
  userEducationInfoAction,
  userLanguageInfoAction,
} from "@/actions/user.action";
import { ProInfoAddBtn } from "@/components/buttons";
import { GraduationIcon } from "@/public/assets/svgs";
import { TProfileURLProps } from "@/types/utils.types";

const LanguageEducationDetails = async ({ params }: TProfileURLProps) => {
  const languageData = await userLanguageInfoAction(params.userId);
  if (languageData?.status === 400) return null;

  const educationData = await userEducationInfoAction(params.userId);
  if (educationData?.status === 400) return null;
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="profile-detail-heading w-[65%]">
        <GraduationIcon /> Languages & Education
      </div>

      <div className="flex w-full items-start justify-between gap-6">
        <article className="flex w-full max-w-[22rem] flex-col gap-4">
          <h4 className="flex-between w-full text-sm">
            Languages
            <ProInfoAddBtn detailName="language" dataArray={languageData} />
          </h4>
          <div className="flex flex-col rounded-2xl border-2 border-dark-400 bg-dark-300/70 p-2">
            {languageData}
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

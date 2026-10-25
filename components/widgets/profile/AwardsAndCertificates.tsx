import { getUserAwardInfoAction } from "@/actions/user.action";
import { TProfileURLProps } from "@/types/utils.types";
import { AwardsIcon } from "@/public/assets/svgs";
import { ProInfoAddBtn } from "@/components/buttons";
import { getCurrentUserId } from "@/lib/session";
import { EmptyDetails } from "@/components/others";
import { IAwardsOrCertificate } from "@/types/profile.types";
import { AwardCard } from "@/components/cards/ProDetailCards";

const AwardsAndCertificates = async ({ params }: TProfileURLProps) => {
  const currentUserId = await getCurrentUserId();
  const isOwnProfile = currentUserId === params.userId;

  const awardData = await getUserAwardInfoAction(params.userId);
  if (!isOwnProfile && awardData.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex-between profile-detail-heading w-1/2">
        <div className="flex items-center gap-4">
          <AwardsIcon /> Awards & Certificates
        </div>

        {isOwnProfile && (
          <div className="mr-14 flex items-center">
            <ProInfoAddBtn detailName="award" dataArray={awardData} />
          </div>
        )}
      </div>
      {awardData.length > 0 ? (
        <article className="flex w-full max-w-[22rem] flex-col rounded-2xl border-2 border-dark-400 bg-dark-300/70 p-2">
          {awardData.map((item: IAwardsOrCertificate, index: number) => (
            <AwardCard
              key={item._id}
              data={item}
              index={index}
              length={awardData.length}
              dataArray={awardData}
            />
          ))}
        </article>
      ) : (
        <div className="max-w-[22rem] pt-6">
          <EmptyDetails
            Icon={AwardsIcon}
            text="Not added any awards / certificates yet"
            size="56px"
          />
        </div>
      )}
    </div>
  );
};

export default AwardsAndCertificates;

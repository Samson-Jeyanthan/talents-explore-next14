import { TCurrentUserData, TPublicUserData } from "@/types/profile.types";
import { TProfileURLProps } from "@/types/utils.types";
import { fetchUserDataAction } from "@/actions/user.action";
import {
  AwardsAndCertificates,
  BioDetails,
  EducationDetails,
  LanguageDetails,
  MyPhotos,
  TopPosts,
} from "@/components/widgets";

async function Overview({ params }: TProfileURLProps) {
  const userData: TCurrentUserData | TPublicUserData =
    await fetchUserDataAction(params.userId, params.username);
  if (!userData) return null;

  return (
    <section className="my-5 flex w-full flex-col gap-3 text-light-900">
      {userData?.isTalent && <TopPosts params={params} />}
      <div className="flex flex-col gap-3 bg-dark-250 p-2">
        <BioDetails userData={userData} />
        {userData?.isTalent && (
          <MyPhotos myPhotos={userData?.morePersonalInfo?.featuredPhotos} />
        )}
      </div>

      {userData?.isTalent && (
        <div className="flex gap-3 rounded-3xl border-2 border-dark-300 bg-dark-300/20 p-3">
          <EducationDetails params={params} />
          <LanguageDetails params={params} />
          <AwardsAndCertificates params={params} />
        </div>
      )}
    </section>
  );
}

export default Overview;

import { TCurrentUserData, TPublicUserData } from "@/types/profile.types";
import { TProfileURLProps } from "@/types/utils.types";
import { fetchUserDataAction } from "@/actions/user.action";
import {
  AwardsAndCertificates,
  BioDetails,
  LanguageEducationDetails,
  MyPhotos,
  TopPosts,
} from "@/components/widgets";

async function Overview({ params }: TProfileURLProps) {
  const userData: TCurrentUserData | TPublicUserData =
    await fetchUserDataAction(params.userId, params.username);
  if (!userData) return null;

  return (
    <section className="flex w-full gap-3 text-light-900">
      <div className="flex w-[22rem] min-w-[22rem] flex-col gap-6 rounded-3xl border-2 border-dark-300 bg-dark-250 p-4">
        <BioDetails userData={userData} />
        <MyPhotos myPhotos={userData?.morePersonalInfo?.featuredPhotos} />
      </div>
      <div className="flex w-full flex-col gap-6 rounded-3xl border-2 border-dark-300 bg-dark-250 p-4">
        <TopPosts params={params} />
        <p className="text-justify text-sm text-light-800">
          {userData?.morePersonalInfo?.bio}
        </p>
        <LanguageEducationDetails params={params} />
        <AwardsAndCertificates params={params} />
      </div>
    </section>
  );
}

export default Overview;

import { TCurrentUserData, TPublicUserData } from "@/types/profile.types";
import { TProfileURLProps } from "@/types/utils.types";
import { fetchUserDataAction } from "@/actions/user.action";
import {
  AwardsAndCertificates,
  BioDetails,
  EducationDetails,
  LanguageDetails,
  MyPhotos,
} from "@/components/widgets";

async function Overview({ params }: TProfileURLProps) {
  const userData: TCurrentUserData | TPublicUserData =
    await fetchUserDataAction(params.userId, params.username);
  if (!userData) return null;

  return (
    <section className="mt-5 w-full text-light-900">
      <BioDetails userData={userData} />
      <MyPhotos myPhotos={userData?.morePersonalInfo?.featuredPhotos} />
      <AwardsAndCertificates params={params} />
      <EducationDetails params={params} />
      <LanguageDetails params={params} />
    </section>
  );
}

export default Overview;

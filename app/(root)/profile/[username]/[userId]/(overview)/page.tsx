import { TCurrentUserData, TPublicUserData } from "@/types/profile.types";
import { ProfileURLProps } from "../layout";
import { fetchUserDataAction } from "@/actions/user.action";
import { BioDetails, MyPhotos } from "@/components/widgets";

async function Overview({ params }: ProfileURLProps) {
  const userData: TCurrentUserData | TPublicUserData =
    await fetchUserDataAction(params.userId, params.username);
  if (!userData) return null;

  return (
    <section className="mt-5 w-full text-light-900">
      <BioDetails userData={userData} />
      <MyPhotos myPhotos={userData?.morePersonalInfo?.featuredPhotos} />
    </section>
  );
}

export default Overview;

import { TCurrentUserData, TPublicUserData } from "@/types/profile.types";
import { TProfileURLProps } from "@/types/utils.types";
import { fetchUserDataAction } from "@/actions/user.action";
import {
  AwardsAndCertificates,
  BioDetails,
  Contact,
  LanguageEducationDetails,
  MyPhotos,
  TopPosts,
} from "@/components/widgets";
import { getSession } from "@/lib/session";

async function Overview({ params }: TProfileURLProps) {
  const userData: TCurrentUserData | TPublicUserData =
    await fetchUserDataAction(params.userId, params.username);
  if (!userData) return null;

  const token = await getSession();
  const isOwnProfile = token === params.userId;

  const isTalent = userData?.isTalent;

  return (
    <section className="flex w-full max-w-screen-xl gap-3 overflow-x-hidden text-light-850">
      <div
        className={`${isTalent ? "border-2 border-dark-300 bg-dark-250 p-4" : "p-2"} flex w-[21rem] min-w-[21rem] flex-col gap-10 rounded-3xl`}
      >
        <BioDetails userData={userData} />
        {isTalent && (
          <>
            <Contact userData={userData} />
            <MyPhotos myPhotos={userData?.morePersonalInfo?.featuredPhotos} />
          </>
        )}
      </div>

      {isTalent && (
        <div className="flex w-full max-w-[852px] flex-col items-start gap-10 rounded-3xl border-2 border-dark-300 bg-dark-250 p-4">
          <TopPosts params={params} isOwnProfile={isOwnProfile} />
          <div className="flex flex-col gap-2">
            <h3 className="text-sm">Description</h3>
            <p className="w-5/6 text-justify text-[13px] text-light-500">
              {userData?.morePersonalInfo?.bio}
            </p>
          </div>
          <LanguageEducationDetails params={params} />
          <AwardsAndCertificates params={params} />
        </div>
      )}
    </section>
  );
}

export default Overview;

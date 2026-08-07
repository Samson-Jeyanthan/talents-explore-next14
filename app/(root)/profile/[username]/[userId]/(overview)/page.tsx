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
import { addLineBreaks } from "@/lib/utils/addLinkBreaks";
import { getProfileVisibilityState } from "@/lib/utils/profilePrivacy";
import { getUserPersonalInfoAction } from "@/actions/auth.action";

async function Overview({ params }: TProfileURLProps) {
  const userData: TCurrentUserData | TPublicUserData =
    await fetchUserDataAction(params.userId, params.username);
  if (!userData) return null;

  const res = await getUserPersonalInfoAction("");
  const currentUser = res?.response;
  const isOwnProfile = currentUser?._id === params.userId;
  const visibility = getProfileVisibilityState(userData, isOwnProfile);

  const isTalent = userData?.isTalent;

  return (
    <section className="flex w-full max-w-screen-xl gap-3 overflow-x-hidden text-light-850">
      <div
        className={`${isTalent ? "w-72 min-w-72 border-2 border-dark-300 bg-dark-250 p-4 2xl:w-[21rem] 2xl:min-w-[21rem]" : "w-[21rem] min-w-[21rem] p-2"} flex flex-col gap-10 rounded-3xl `}
      >
        <BioDetails userData={userData} isOwnProfile={isOwnProfile} />
        {isTalent && (
          <>
            <Contact userData={userData} isOwnProfile={isOwnProfile} />
            {visibility.canViewProfile ? (
              <MyPhotos myPhotos={userData?.morePersonalInfo?.featuredPhotos} />
            ) : null}
          </>
        )}
      </div>

      {isTalent && (
        <div className="flex w-full max-w-[852px] flex-col items-start gap-10 rounded-3xl border-2 border-dark-300 bg-dark-250 p-4">
          {visibility.canViewProfile ? (
            <>
              {visibility.canViewPosts ? (
                <TopPosts params={params} isOwnProfile={isOwnProfile} />
              ) : null}
              <div className="flex flex-col gap-2">
                <h3 className="text-sm">Description</h3>
                <div className="w-5/6 text-justify text-[13px]">
                  {addLineBreaks(userData?.morePersonalInfo?.bio)}
                </div>
              </div>
              <LanguageEducationDetails params={params} />
              <AwardsAndCertificates params={params} />
            </>
          ) : (
            <div className="w-full rounded-3xl border border-dark-300 bg-dark-300/40 p-6 text-center text-light-500">
              This profile is private for your current visibility level.
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default Overview;

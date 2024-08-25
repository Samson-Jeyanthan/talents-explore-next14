import React from "react";
import {
  ProfileCover,
  ProfileHeader,
  NormalUserProfileHeader,
} from "@/components/widgets";
import { Tabs } from "@/components/widgets/ProfileTabs";

import type { Metadata, ResolvingMetadata } from "next";
import { userPublicInfoAction } from "@/actions/user.action";
import { getSession } from "@/lib/session";
import { userPersonalInfoAction } from "@/actions/auth.action";

type Props = {
  params: { userId: string; username: string };
};

async function fetchUserData(userId: string, viewerId: string) {
  const token = await getSession();
  if (token !== "") {
    if (token === userId) {
      const userData = await userPersonalInfoAction(userId);
      return userData;
    } else {
      const userData = await userPublicInfoAction(userId, token);
      return userData;
    }
  } else {
    const userData = await userPublicInfoAction(userId, viewerId);
    return userData;
  }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const userData = await fetchUserData(params.userId, params.username);

  // optionally access and extend (rather than replace) parent metadata
  // const previousImages = (await parent).openGraph?.images || [];

  return {
    title:
      "Profile" +
      " | " +
      userData.response.personalInfo.firstName +
      " " +
      userData.response.personalInfo.lastName,
    // openGraph: {
    //   images: ["/some-specific-page-image.jpg", ...previousImages],
    // },
  };
}

const layout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { userId: string; username: string };
}) => {
  const userData = await fetchUserData(params.userId, params.username);
  const token = await getSession();
  const isOwnProfile = token === params.userId;
  return (
    <main className="flex-center">
      <section className="relative flex w-full max-w-screen-xl flex-col items-center justify-center 2xl:max-w-[1380px]">
        <ProfileCover
          coverPhoto={userData?.response?.personalInfo?.coverImage}
          isTalent={userData?.response?.isTalent}
          avgRating={userData?.response?.avgRating}
        />
        <div
          className={`${userData?.response?.isTalent ? "z-10 mt-[36vh]" : ""} flex-center  w-full flex-col`}
        >
          {userData?.response?.isTalent ? (
            <ProfileHeader
              userData={userData?.response}
              isOwnProfile={isOwnProfile}
              // userId={ params.userId }
            />
          ) : (
            <NormalUserProfileHeader
              userData={userData?.response}
              isOwnProfile={isOwnProfile}
            />
          )}

          <div className="flex-center w-full max-w-screen-xl flex-col bg-dark-200 pt-8">
            {userData?.response?.isTalent ? (
              <Tabs
                tabs={[
                  {
                    title: "Overview",
                    value: "overview",
                    href: `/profile/${params.username}/${params.userId}/`,
                  },
                  {
                    title: "All Posts",
                    value: "all-posts",
                    href: `/profile/${params.username}/${params.userId}/all-posts`,
                  },
                  {
                    title: "Skills",
                    value: "skills",
                    href: `/profile/${params.username}/${params.userId}/skills`,
                  },
                ]}
              />
            ) : null}
            {children}
          </div>
        </div>
      </section>
    </main>
  );
};

export default layout;

// bg-gradient-to-b from-[rgb(17,19,27,0.70)] to-[rgba(17,19,27)] backdrop-blur-lg

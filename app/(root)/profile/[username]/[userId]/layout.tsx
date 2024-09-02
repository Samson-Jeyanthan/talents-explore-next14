import React from "react";
import {
  ProfileCover,
  ProfileHeader,
  NormalUserProfileHeader,
  ProfileTabs,
} from "@/components/widgets";
import type { Metadata, ResolvingMetadata } from "next";
import { fetchUserDataAction } from "@/actions/user.action";
import { getSession } from "@/lib/session";
import NotFound from "../../not-found";
import { TProfileURLProps } from "@/types/utils.types";

export async function generateMetadata(
  { params }: TProfileURLProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const userData = await fetchUserDataAction(params.userId, params.username);

  // optionally access and extend (rather than replace) parent metadata
  // const previousImages = (await parent).openGraph?.images || [];

  if (!userData) {
    return {
      title: "User Not Found",
    };
  } else
    return {
      title:
        userData?.personalInfo?.firstName +
        " " +
        userData?.personalInfo?.lastName +
        "" +
        "Profile",

      // openGraph: {
      //   images: ["/some-specific-page-image.jpg", ...previousImages],
      // },
    };
}

async function layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { userId: string; username: string };
}) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const userData = await fetchUserDataAction(params.userId, params.username);
  const token = await getSession();
  const isOwnProfile = token === params.userId;
  if (!userData) {
    return <NotFound />;
  }
  return (
    <main className="flex-center">
      <section className="relative flex w-full max-w-screen-lg flex-col items-center justify-center 2xl:max-w-[1200px]">
        <ProfileCover
          coverPhoto={userData?.personalInfo?.coverImage}
          isTalent={userData?.isTalent}
          avgRating={userData?.avgRating}
        />

        <div
          className={`${userData?.isTalent ? "z-10 mt-[30vh]" : ""} flex-center  w-full flex-col`}
        >
          {userData?.isTalent ? (
            <ProfileHeader userData={userData} isOwnProfile={isOwnProfile} />
          ) : (
            <NormalUserProfileHeader
              userData={userData}
              isOwnProfile={isOwnProfile}
            />
          )}

          <div className="flex-center w-full max-w-screen-xl flex-col bg-dark-200 pt-8">
            {userData?.isTalent ? (
              <ProfileTabs
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
                    title: "Credits",
                    value: "credits",
                    href: `/profile/${params.username}/${params.userId}/credits`,
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
}

export default layout;

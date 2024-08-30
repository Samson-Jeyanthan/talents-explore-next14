import React from "react";
import {
  ProfileCover,
  ProfileHeader,
  NormalUserProfileHeader,
} from "@/components/widgets";
import { Tabs } from "@/components/widgets/ProfileTabs";

import type { Metadata, ResolvingMetadata } from "next";
import { fetchUserDataAction } from "@/actions/user.action";
import { getSession } from "@/lib/session";
import { notFound } from "next/navigation";
// import { notFound } from "next/navigation";

export type ProfileURLProps = {
  params: { userId: string; username: string };
};

export async function generateMetadata(
  { params }: ProfileURLProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const res = await fetchUserDataAction(params.userId, params.username);

  // optionally access and extend (rather than replace) parent metadata
  // const previousImages = (await parent).openGraph?.images || [];

  if (!res) {
    return {
      title: "User Not Found",
    };
  }

  return {
    title:
      "Profile" +
      " | " +
      res?.response?.personalInfo?.firstName +
      " " +
      res?.response?.personalInfo?.lastName,
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
  const res = await fetchUserDataAction(params.userId, params.username);
  const token = await getSession();
  const isOwnProfile = token === params.userId;

  if (!res) {
    notFound();
  }

  return (
    <main className="flex-center">
      <section className="relative flex w-full max-w-screen-lg flex-col items-center justify-center 2xl:max-w-[1200px]">
        <ProfileCover
          coverPhoto={res?.response?.personalInfo?.coverImage}
          isTalent={res?.response?.isTalent}
          avgRating={res?.response?.avgRating}
        />

        <div
          className={`${res?.response?.isTalent ? "z-10 mt-[30vh]" : ""} flex-center  w-full flex-col`}
        >
          {res?.response?.isTalent ? (
            <ProfileHeader
              userData={res?.response}
              isOwnProfile={isOwnProfile}
            />
          ) : (
            <NormalUserProfileHeader
              userData={res?.response}
              isOwnProfile={isOwnProfile}
            />
          )}

          <div className="flex-center w-full max-w-screen-xl flex-col bg-dark-200 pt-8">
            {res?.response?.isTalent ? (
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

import React from "react";
import { ProfileCover, ProfileHeader } from "@/components/widgets";
import { Tabs } from "@/components/widgets/ProfileTabs";

import type { Metadata, ResolvingMetadata } from "next";
import { userPublicInfoAction } from "@/actions/user.action";

type Props = {
  params: { userId: string; username: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // read route params
  const userId = params.userId;
  const username = params.username;

  // fetch data
  const userData = await userPublicInfoAction(userId, username);

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

const layout = ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { userId: string; username: string };
}) => {
  return (
    <main className="flex-center">
      <section className="relative flex w-full max-w-screen-xl flex-col items-center justify-center 2xl:max-w-[1380px]">
        <ProfileCover />
        <div className="flex-center z-10 mt-[36vh] w-full flex-col">
          <ProfileHeader />

          <div className="flex-center w-full max-w-screen-xl flex-col bg-dark-200 pt-8">
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
            {children}
          </div>
        </div>
      </section>
    </main>
  );
};

export default layout;

// bg-gradient-to-b from-[rgb(17,19,27,0.70)] to-[rgba(17,19,27)] backdrop-blur-lg

import React from "react";
import {
  ProfileCover,
  ProfileHeader,
  NormalUserProfileHeader,
  ProfileTabs,
  Footer,
} from "@/components/widgets";
import type { Metadata, ResolvingMetadata } from "next";
import { fetchUserDataAction } from "@/actions/user.action";
import NotFound from "../../not-found";
import { TProfileURLProps } from "@/types/utils.types";
import { getCurrentChatUserAction } from "@/actions/chat.action";
import { getProfileVisibilityState } from "@/lib/utils/profilePrivacy";

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
        " | " +
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
  // await new Promise((resolve) => setTimeout(resolve, 1000));
  const userData = await fetchUserDataAction(params.userId, params.username);
  const currentUser = await getCurrentChatUserAction();
  const isOwnProfile = currentUser?._id === params.userId;
  if (!userData) {
    return <NotFound />;
  }

  const isTalent = userData?.isTalent;
  const isLoggedIn = !currentUser?._id;
  const visibility = getProfileVisibilityState(userData, isOwnProfile);

  return (
    <main
      className={`${isLoggedIn && "pt-6"} container-wrapper flex-col gap-6 pb-6`}
    >
      <ProfileCover
        coverPhoto={userData?.personalInfo?.coverImage}
        isTalent={isTalent}
        avgRating={userData?.avgRating}
        isLoggedIn={isLoggedIn}
      />

      <section
        className={`${isTalent ? "z-10 -mt-12" : "-mt-4"} flex-center w-full flex-col`}
      >
        {isTalent ? (
          <ProfileHeader userData={userData} isOwnProfile={isOwnProfile} />
        ) : (
          <NormalUserProfileHeader
            userData={userData}
            isOwnProfile={isOwnProfile}
          />
        )}

        <div className="flex-center w-full max-w-screen-xl flex-col gap-6 bg-dark-200 pt-8">
          {isTalent ? (
            <ProfileTabs
              tabs={[
                {
                  title: "Overview",
                  value: "",
                  href: `/profile/${params.username}/${params.userId}/`,
                },
                ...(visibility.canViewPosts
                  ? [
                      {
                        title: "All Posts",
                        value: "all-posts",
                        href: `/profile/${params.username}/${params.userId}/all-posts`,
                      },
                    ]
                  : []),
                ...(visibility.canViewSharedPosts
                  ? [
                      {
                        title: "Credits",
                        value: "credits",
                        href: `/profile/${params.username}/${params.userId}/credits`,
                      },
                    ]
                  : []),
                ...(visibility.canViewProfile
                  ? [
                      {
                        title: "Skills",
                        value: "skills",
                        href: `/profile/${params.username}/${params.userId}/skills`,
                      },
                    ]
                  : []),
              ]}
            />
          ) : null}
          {children}
        </div>
      </section>
      <Footer />
    </main>
  );
}

export default layout;

import React from "react";
import { ProfileCover, ProfileHeader } from "@/components/widgets";
import { Tabs } from "@/components/widgets/ProfileTabs";

const layout = ({ children }: { children: React.ReactNode }) => {
  const userId = "123";
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
                  href: `/profile/${userId}/`,
                },
                {
                  title: "All Posts",
                  value: "all-posts",
                  href: `/profile/${userId}/all-posts`,
                },
                {
                  title: "Skills",
                  value: "skills",
                  href: `/profile/${userId}/skills`,
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

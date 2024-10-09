"use client";

import Image from "next/image";
import { Spotlight } from "../../ui/Spotlight";
import { motion as m } from "framer-motion";
import { useUserContext } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";

const AccountSelection = () => {
  const { user } = useUserContext();
  const router = useRouter();
  const spotlightColor = "rgba(255,255,255,0.3)";

  const handleAccountSelection = (skip: boolean) => {
    if (skip) {
      router.push(`/profile/${user.username}/${user.currentUserId}`);
    } else {
      router.push("/talent-account-register-form");
    }
  };

  return (
    <>
      <div className="absolute left-0 top-0 h-full w-1/2 rotate-[10deg]">
        <Spotlight className="left-0 h-4/6 w-[10%]" fill={spotlightColor} />
        <Spotlight
          className="left-1/4 h-4/6 w-[10%] rotate-45"
          fill={spotlightColor}
        />
        <Spotlight className="left-[55%] h-4/6 w-[10%]" fill={spotlightColor} />
      </div>
      <div className="absolute right-2 top-14 size-full rotate-[-5deg] -scale-x-100">
        <Spotlight
          className="right-[17%] h-4/6 w-[10%]"
          fill={spotlightColor}
        />
        <Spotlight
          className="right-[2%] top-5 h-4/6 w-[10%] rotate-45"
          fill={spotlightColor}
        />
        <Spotlight
          className="right-[-10%] h-4/6 w-[10%]"
          fill={spotlightColor}
        />
      </div>

      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="flex-center z-10 mb-16 flex-col gap-5"
      >
        <h1 className="text-center text-4xl font-semibold text-light-900">
          Choose Your Account
          <br />
          Type
        </h1>

        <div className="account_selection_button mt-16">
          <Image
            src="/assets/images/become-talent-icon.png"
            width={512}
            height={512}
            alt="img"
            className="size-[4.2rem] rounded-xl border-2 border-dark-250 bg-dark-300 p-2"
          />
          <div className="flex flex-col gap-1">
            Wanna Become a Talent
            <p className="text-sm">Just with in few steps</p>
          </div>
        </div>

        <div
          className="account_selection_button"
          onClick={() => handleAccountSelection(true)}
        >
          <Image
            src="/assets/images/normal-user-icon.png"
            width={512}
            height={512}
            alt="img"
            className="size-[4.2rem] rounded-xl border-2 border-dark-250 bg-dark-300 p-2"
          />
          <div className="flex flex-col gap-1">
            Continue as Normal User
            <p className="text-sm">Let&apos;s dive into the app</p>
          </div>
        </div>
      </m.div>
    </>
  );
};

export default AccountSelection;

import {
  getLanguagesAction,
  getProfessionsAction,
} from "@/actions/utils.action";
import { CompleteProfileForm } from "@/components/forms";
import { Metadata } from "next";
// import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Complete Profile | Talents Explore",
  description: "",
};

const CompleteProfile = async () => {
  const langData = await getLanguagesAction();
  const professionData = await getProfessionsAction();
  // console.log(professionData);

  return (
    <div className="flex-start min-h-screen w-full flex-col">
      <div className="my-3 flex max-w-6xl flex-col 2xl:my-8">
        <h1 className="h1-bold text-light-900">
          Let&apos;s Create a Public Profile for You
        </h1>
        <p className="body-regular 2xl:parah-regular text-light-700">
          Complete your profile by uploading a profile photo and cover photos,
          as well as filling out the form below. Providing more information will
          help others to trust and connect with you.
        </p>
        {/* <Suspense fallback={<div>Loading...</div>}> */}

        <CompleteProfileForm
          langData={langData}
          professionData={professionData}
        />
        {/* </Suspense> */}
      </div>
    </div>
  );
};

export default CompleteProfile;

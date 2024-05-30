// import { getLanguages } from "@/lib/utils/getData";

import { CompleteProfileForm } from "@/components/forms";
// import { getLanguages } from "@/lib/data/getData";

const CompleteProfile = () => {
  // const langData = getLanguages();

  return (
    <>
      <title>Complete Profile | Talents Explore</title>
      <div className="flex-start min-h-screen w-full flex-col">
        <div className="my-3 flex max-w-6xl flex-col 2xl:my-8">
          <h1 className="h1-bold text-light-900">
            Let&apos;s Create a Public Profile for You
          </h1>
          <p className="body-regular 2xl:parah-regular text-light-700">
            Complete your profile by uploading a profile photo and cover photos,
            as well as filling out the form below. Providing more information
            will help others to trust and connect with you.
          </p>
          <CompleteProfileForm
          // langData={ langData }
          />
        </div>
      </div>
    </>
  );
};

export default CompleteProfile;

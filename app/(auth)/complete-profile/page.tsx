import { checkIsAboutAction } from "@/actions/auth.action";
import {
  getLanguagesAction,
  getProfessionsAction,
} from "@/actions/utils.action";
import { CompleteProfileForm } from "@/components/forms";
import { verifySession } from "@/lib/session";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Complete Profile | Talents Explore",
  description: "",
};

const CompleteProfile = async () => {
  const langData = await getLanguagesAction();
  const professionData = await getProfessionsAction();
  const token = await verifySession();

  if (token) {
    const res = await checkIsAboutAction(token);
    if (res) redirect("/home");
  } else {
    redirect("/sign-in");
  }

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
        <CompleteProfileForm
          langData={langData}
          professionData={professionData}
        />
      </div>
    </div>
  );
};

export default CompleteProfile;

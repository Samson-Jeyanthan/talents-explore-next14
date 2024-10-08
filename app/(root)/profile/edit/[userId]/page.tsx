import { fetchUserDataAction } from "@/actions/user.action";
import {
  getLanguagesAction,
  getProfessionsAction,
} from "@/actions/utils.action";
import { EditProfileForm } from "@/components/forms";
import { getSession } from "@/lib/session";
import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";

type ParamsProps = {
  params: { userId: string };
};

export async function generateMetadata(
  { params }: ParamsProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const userData = await fetchUserDataAction(params.userId, params.userId);

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
        "Edit Profile",

      // openGraph: {
      //   images: ["/some-specific-page-image.jpg", ...previousImages],
      // },
    };
}

const EditProfile = async ({ params }: ParamsProps) => {
  const token = await getSession();
  const isOwnProfile = token === params.userId;
  const langData = await getLanguagesAction();
  const professionData = await getProfessionsAction();
  const userData = await fetchUserDataAction(params.userId, params.userId);

  if (!isOwnProfile) {
    redirect("/home");
  }

  return (
    <div className="container-wrapper flex-col pb-8">
      <h1 className="h1-bold flex-start w-full text-light-900">Edit Profile</h1>
      <EditProfileForm
        langData={langData}
        professionData={professionData}
        userData={userData}
      />
    </div>
  );
};

export default EditProfile;

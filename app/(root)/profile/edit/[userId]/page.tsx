import { fetchUserDataAction } from "@/actions/user.action";
import {
  getLanguagesAction,
  getProfessionsAction,
} from "@/actions/utils.action";
import { Footer } from "@/components/widgets";
import { ParentEditProfileForm } from "@/components/widgets/multiStepForms";
import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentChatUserAction } from "@/actions/chat.action";

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
  const currentUser = await getCurrentChatUserAction();
  const isOwnProfile = currentUser?._id === params.userId;
  const langData = await getLanguagesAction();
  const professionData = await getProfessionsAction();
  const userData = await fetchUserDataAction(params.userId, params.userId);

  if (!isOwnProfile) {
    redirect("/home");
  }

  return (
    <div className="container-wrapper flex-col pb-6">
      <h1 className="h1-bold flex-start w-full text-light-900">Edit Profile</h1>
      <ParentEditProfileForm
        langData={langData}
        professionData={professionData}
        userData={userData}
      />
      <Footer />
    </div>
  );
};

export default EditProfile;

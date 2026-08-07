import { fetchUserDataAction } from "@/actions/user.action";
import {
  getLanguagesAction,
  getProfessionsAction,
} from "@/actions/utils.action";
import { Footer } from "@/components/widgets";
import { EditProfileForm } from "@/components/widgets/multiStepForms";
import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";
import { getUserPersonalInfoAction } from "@/actions/auth.action";

type ParamsProps = {
  params: { userId: string };
};

export async function generateMetadata(
  { params }: ParamsProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const userData = await fetchUserDataAction(params.userId, params.userId);

  if (!userData) {
    return {
      title: "User Not Found",
    };
  } else
    return {
      title:
        "Edit Profile" +
        " | " +
        userData?.personalInfo?.firstName +
        " " +
        userData?.personalInfo?.lastName,
    };
}

const EditProfile = async ({ params }: ParamsProps) => {
  const res = await getUserPersonalInfoAction("");
  const currentUser = res?.response;
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
      <EditProfileForm
        langData={langData}
        professionData={professionData}
        userData={userData}
      />
      <Footer />
    </div>
  );
};

export default EditProfile;

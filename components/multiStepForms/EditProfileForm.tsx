"use client";

import { userPersonalInfoEditAction } from "@/actions/user.action";
import { EditPersonalInfoForm, EditProInfoForm } from "@/components/forms";
// import { TransparentLoader } from "@/components/modals";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useUserContext } from "@/context/AuthProvider";
import { uploadFileToStorage } from "@/lib/utils/uploadFile";
import { getEditProfileValidation } from "@/lib/validations/profile.validation";
import { TCurrentUserData } from "@/types/profile.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type Props = {
  langData: any;
  professionData: any;
  userData: TCurrentUserData;
};

const EditProfileForm = ({ langData, professionData, userData }: Props) => {
  const router = useRouter();
  const { user } = useUserContext();
  const [prevURLs, setPrevURLs] = useState<string[]>(
    userData?.morePersonalInfo?.featuredPhotos || []
  );
  const LangOptions = langData?.response?.map((item: any) => ({
    _id: item._id,
    name: item.language,
  }));

  const professionOptions = professionData?.response?.map((item: any) => ({
    _id: item._id,
    name: item.professional,
  }));

  const isTalent = userData?.isTalent === true;
  const validationSchema = getEditProfileValidation(isTalent);

  const form = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      firstName: userData?.personalInfo.firstName || "",
      lastName: userData?.personalInfo.lastName || "",
      knownLanguage: userData?.personalInfo.languageKnown || "",
      profession: userData?.personalInfo.professionalId || "",
      dob: userData?.personalInfo?.dob,
      gender: userData?.personalInfo.gender || "",
      quotes: userData?.personalInfo.shortBio || "",
      coverPhoto: undefined,
      profilePhoto: undefined,
      // professional info
      bio: userData?.morePersonalInfo.bio || "",
      ethnic: userData?.morePersonalInfo.ethnic || "",
      featuredPhotos: [],
      socialLinks: userData?.morePersonalInfo.socialLinks || [],
    },
  });

  const onInvalid = (errors: typeof form.formState.errors) => {
    console.log("❌ Validation errors:", errors);
    console.log("Current values:", form.getValues());
  };

  async function onSubmit(values: z.infer<typeof validationSchema>) {
    console.log(values);
    // personal information form data
    let profileImageKey: any;
    let coverImageKey: any;

    if (values.profilePhoto) {
      profileImageKey = await uploadFileToStorage(
        values.profilePhoto,
        "profile-pic",
        values.firstName
      );
      console.log("profile-photo - values.profilephoto true", profileImageKey);
    }

    if (values.coverPhoto) {
      coverImageKey = await uploadFileToStorage(
        values.coverPhoto,
        "cover-pic",
        values.firstName
      );
      console.log("cover-photo - values.coverphoto true", coverImageKey);
    }

    const personalInfo = {
      firstName: values.firstName,
      lastName: values.lastName,
      dob: values.dob,
      gender: values.gender,
      languageKnown: values.knownLanguage,
      profileImage: profileImageKey
        ? profileImageKey.url
        : userData?.personalInfo.profileImage,
      coverImage: coverImageKey
        ? coverImageKey.url
        : userData?.personalInfo.coverImage,
      shortBio: values.quotes ?? "",
      professional: values.profession ?? null,

      moreInfo: {
        _id: userData?.morePersonalInfo._id,
        bio: values.bio ?? "",
        ethnic: values.ethnic === "" ? null : values.ethnic,
        featuredPhotos: prevURLs ?? [],
        socialLinks: values.socialLinks,
      },
    };

    const res = await userPersonalInfoEditAction(personalInfo);

    if (res.status === "7400") {
      router.push(`/profile/${user.username}/${user.currentUserId}`);
      toast.success("Profile updated successfully!", { duration: 4000 });
    } else {
      toast.error("Failed to update profile. Please try again.", {
        duration: 4000,
      });
    }
  }

  return (
    <>
      {/* {form.formState.isSubmitting && (
        <TransparentLoader text="Updating Profile" />
      )} */}
      <Form {...form}>
        <EditPersonalInfoForm
          form={form}
          userData={userData}
          LangOptions={LangOptions}
          professionOptions={professionOptions}
        />
        {userData?.isTalent && (
          <EditProInfoForm
            form={form}
            userData={userData}
            prevURLs={prevURLs}
            setPrevURLs={setPrevURLs}
          />
        )}
      </Form>
      <div className="my-3 mb-5 flex w-full justify-end gap-3">
        <Button
          className="shad-button_secondary w-40"
          type="button"
          onClick={() =>
            router.push(`/profile/${user.username}/${user.currentUserId}`)
          }
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          onClick={form.handleSubmit(onSubmit, onInvalid)}
          className="shad-button_primary w-40"
        >
          {form.formState.isSubmitting
            ? "Updating Profile..."
            : "Update Profile"}
        </Button>
      </div>
    </>
  );
};

export default EditProfileForm;

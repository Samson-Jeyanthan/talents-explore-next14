"use client";

import { userPersonalInfoEditAction } from "@/actions/user.action";
import { EditPersonalInfoForm, EditProInfoForm } from "@/components/forms";
import { TransparentLoader } from "@/components/modals";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useUserContext } from "@/context/AuthProvider";
import { EditProfileValidation } from "@/lib/validations/profile.validation";
import { TCurrentUserData } from "@/types/profile.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
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

  async function onSubmit(values: z.infer<typeof EditProfileValidation>) {
    console.log(values);
    // personal information form data
    const personalInfo = {
      firstName: values.firstName,
      lastName: values.lastName,
      dob: values.dob,
      gender: values.gender,
      languageKnown: values.knownLanguage,
      profileImage: values.profilePhoto,
      coverImage: values.coverPhoto,
      shortBio: values.quotes,
      professional: values.profession,
      moreInfo: {},
    };
    // professional information form data
    const professionalInfo = {
      bio: values.bio,
      ethnic: values.ethnic,
      featuredPhotos: prevURLs,
      socialLinks: values.socialLinks,
    };
    const res = await userPersonalInfoEditAction(personalInfo);
    console.log(res, "// res of personal info edit // ");
  }

  const form = useForm<z.infer<typeof EditProfileValidation>>({
    resolver: zodResolver(EditProfileValidation),
    defaultValues: {
      firstName: userData?.personalInfo.firstName || "",
      lastName: userData?.personalInfo.lastName || "",
      knownLanguage: userData?.personalInfo.languageKnown || "",
      profession: userData?.personalInfo.professionalId || "",
      dob: userData?.personalInfo?.dob,
      gender: userData?.personalInfo.gender || "",
      quotes: userData?.personalInfo.shortBio || "",
      coverPhoto: userData?.personalInfo.coverImage || undefined,
      profilePhoto: userData?.personalInfo.profileImage || undefined,
      // professional info
      bio: userData?.morePersonalInfo.bio || "",
      ethnic: userData?.morePersonalInfo.ethnic || "",
      featuredPhotos: [],
      socialLinks: userData?.morePersonalInfo.socialLinks || [],
    },
  });

  return (
    <>
      {form.formState.isSubmitting && (
        <TransparentLoader text="Updating Profile" />
      )}
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
          onClick={form.handleSubmit(onSubmit)}
          className="shad-button_primary w-40"
        >
          {form.formState.isSubmitting ? "Updating Profile..." : "Edit Profile"}
        </Button>
      </div>
    </>
  );
};

export default EditProfileForm;

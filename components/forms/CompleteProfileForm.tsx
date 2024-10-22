"use client";

import React from "react";
import { Form, FormField } from "../ui/form";
import {
  CheckboxInput,
  CoverPhoto,
  DateInpt,
  Dropdown,
  FormInput,
  ProfilePhoto,
  TextArea,
} from "../inputs";
import { GENDER_VALUES } from "@/constants";
import { Button } from "../ui/button";
import { CompleteProfileValidation } from "@/lib/validations/auth.validation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { completeProfileAction } from "@/actions/auth.action";
import { convertToISOString } from "@/lib/hooks/useDateSelector";
import { toast } from "sonner";
import { getFileUpload } from "@/lib/utils/getFileUpload";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/context/AuthProvider";
import { TransparentLoader } from "../modals";

const CompleteProfileForm = ({ langData, professionData }: any) => {
  const { user, setUser } = useUserContext();
  const router = useRouter();
  const LangOptions = langData.response.map((item: any) => ({
    _id: item._id,
    name: item.language,
  }));

  const professionOptions = professionData.response.map((item: any) => ({
    _id: item._id,
    name: item.professional,
  }));

  const form = useForm<z.infer<typeof CompleteProfileValidation>>({
    resolver: zodResolver(CompleteProfileValidation),
    defaultValues: {
      firstName: "",
      lastName: "",
      knownLanguage: "",
      profession: "",
      year: "",
      month: "",
      day: "",
      gender: "",
      quotes: "",
      coverPhoto: undefined,
      profilePhoto: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof CompleteProfileValidation>) {
    const convertedDate = convertToISOString(
      values.year,
      values.month,
      values.day
    );
    console.log(values.profilePhoto, "values.profilePhoto");
    console.log(values.coverPhoto, "values.coverPhoto");

    let profileImageKey: string = "";
    let coverImageKey: string = "";

    if (values.profilePhoto) {
      profileImageKey = await getFileUpload(
        values.profilePhoto,
        values.firstName,
        "profile-pic"
      );
      console.log("profile-photo - values.profilephoto true", profileImageKey);
    } else {
      console.log("profile-photo - values.profilephoto false");
    }

    if (values.coverPhoto) {
      coverImageKey = await getFileUpload(
        values.coverPhoto,
        values.firstName,
        "cover-pic"
      );
      console.log("hi there cover photo", coverImageKey);
    }

    const formData = {
      firstName: values.firstName,
      lastName: values.lastName,
      dob: convertedDate,
      gender: values.gender,
      languageKnown: values.knownLanguage,
      profileImage: profileImageKey && profileImageKey,
      coverImage: coverImageKey && coverImageKey,
      shortBio: values.quotes,
      professional: values.profession,
      location: "trincomalee, srilanka",
      latitude: 8.5668,
      longitude: 81.2253,
    };
    console.log(formData, "formData");

    const res = await completeProfileAction(user.currentUserId, formData);

    if (res.status === "7400") {
      setUser({
        currentUserId: user.currentUserId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: user.username,
        email: user.email,
        imageUrl: formData.profileImage,
        isTalent: false,
      });
      toast.success("Profile Updated Successfully", { duration: 5000 });
      router.push("/onboarding");
    } else {
      toast.error("Profile Update Failed", { duration: 4000 });
    }
  }

  return (
    <>
      {form.formState.isSubmitting && (
        <TransparentLoader text="Submitting Form" />
      )}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mt-4 flex w-full flex-col gap-5"
        >
          <div className="flex w-full flex-col gap-6">
            <FormField
              control={form.control}
              name="coverPhoto"
              render={({ field }) => (
                <CoverPhoto fieldChange={field.onChange} />
              )}
            />
            <FormField
              control={form.control}
              name="profilePhoto"
              render={({ field }) => (
                <ProfilePhoto fieldChange={field.onChange} />
              )}
            />
          </div>

          <div className="mt-4 flex w-full max-w-screen-md flex-col gap-6">
            <div className="flex w-full gap-4">
              <FormInput
                form={form}
                formLabel="First Name"
                inputName="firstName"
                inputType="text"
                placeholder="John"
              />
              <FormInput
                form={form}
                formLabel="Last Name"
                inputName="lastName"
                inputType="text"
                placeholder="Doe"
              />
            </div>

            <div className="flex w-full flex-col gap-1">
              <label className="shad-auth_form_label">Username</label>
              <div className="shad-auth_form_input flex-start gap-4 rounded-md p-2 px-3 text-sm">
                @{user.username}
              </div>
            </div>

            <div className="flex w-full flex-col gap-1">
              <label className="shad-auth_form_label">Email</label>
              <div className="shad-auth_form_input flex-start gap-4 rounded-md p-2 px-3 text-sm">
                {user.email}
              </div>
            </div>

            <CheckboxInput
              form={form}
              inputName="gender"
              formLabel="Gender"
              data={GENDER_VALUES}
            />

            <DateInpt
              form={form}
              formLabel="Date of Birth"
              yearValue={form.getValues("year")}
              monthValue={form.getValues("month")}
              dayValue={form.getValues("day")}
            />

            <Dropdown
              form={form}
              value={form.getValues("knownLanguage")}
              formLabel="Native Language"
              inputName="knownLanguage"
              placeholder="Select your native language"
              formDescription="Let us know the language you speak so we can connect you with people who share your interests and culture."
              options={LangOptions}
            />

            <Dropdown
              form={form}
              value={form.getValues("profession")}
              formLabel="Profession"
              inputName="profession"
              placeholder="Select your profession"
              formDescription="This information helps us understand your professional background and can be used to provide you with relevant content and services."
              options={professionOptions}
            />

            <TextArea
              form={form}
              formLabel="Quotes"
              inputName="quotes"
              placeholder="What's on your mind...?"
              formDescription="Keep it positive: Let's create a supportive community by sharing constructive and respectful messages."
              maxLength={120}
            />
          </div>

          <div className="flex w-full justify-end">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="shad-button_primary mt-4 w-40"
            >
              {form.formState.isSubmitting
                ? "Creating Profile..."
                : "Create Profile"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};

export default CompleteProfileForm;

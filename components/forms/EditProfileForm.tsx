"use client";

import { EditProfileValidation } from "@/lib/validations/profile.validation";
import { TCurrentUserData } from "@/types/profile.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormField } from "../ui/form";
import {
  CheckboxInput,
  CoverPhoto,
  Dropdown,
  FormInput,
  ProfilePhoto,
  TextArea,
  DateInput,
} from "../inputs";
import { GENDER_VALUES } from "@/constants";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/context/AuthProvider";
import { TransparentLoader } from "../modals";

type Props = {
  langData: any;
  professionData: any;
  userData: TCurrentUserData;
};

const EditProfileForm = ({ langData, professionData, userData }: Props) => {
  const router = useRouter();
  const { user } = useUserContext();
  const LangOptions = langData.response.map((item: any) => ({
    _id: item._id,
    name: item.language,
  }));

  const professionOptions = professionData.response.map((item: any) => ({
    _id: item._id,
    name: item.professional,
  }));

  const form = useForm<z.infer<typeof EditProfileValidation>>({
    resolver: zodResolver(EditProfileValidation),
    defaultValues: {
      firstName: userData?.personalInfo.firstName || "",
      lastName: userData?.personalInfo.lastName || "",
      knownLanguage: userData?.personalInfo.languageKnown || "",
      profession: userData?.personalInfo.professionalId || "",
      year: "",
      month: "",
      day: "",
      gender: userData?.personalInfo.gender || "",
      quotes: userData?.personalInfo.shortBio || "",
      coverPhoto: userData?.personalInfo.coverImage || undefined,
      profilePhoto: userData?.personalInfo.profileImage || undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof EditProfileValidation>) {
    console.log(values);
  }

  return (
    <>
      {form.formState.isSubmitting && (
        <TransparentLoader text="Updating Profile" />
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
                <CoverPhoto
                  fieldChange={field.onChange}
                  mediaUrl={userData?.personalInfo.coverImage}
                />
              )}
            />
            <FormField
              control={form.control}
              name="profilePhoto"
              render={({ field }) => (
                <ProfilePhoto
                  fieldChange={field.onChange}
                  mediaUrl={userData?.personalInfo.profileImage}
                />
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

            <CheckboxInput
              form={form}
              inputName="gender"
              formLabel="Gender"
              data={GENDER_VALUES}
            />

            <DateInput
              form={form}
              formLabel="Date of Birth"
              yearName="year"
              monthName="month"
              dayName="day"
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
              className="shad-button_primary w-40"
            >
              {form.formState.isSubmitting
                ? "Updating Profile..."
                : "Edit Profile"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};

export default EditProfileForm;

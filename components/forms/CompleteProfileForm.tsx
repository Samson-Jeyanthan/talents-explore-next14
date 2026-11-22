"use client";

import { Form, FormField, FormMessage } from "../ui/form";
import {
  CheckboxInput,
  CoverPhoto,
  DateInput,
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/context/AuthProvider";
import { TransparentLoader } from "../modals";
import { uploadFileToStorage, type UploadedFile } from "@/lib/utils/uploadFile";
import { useEffect, useRef } from "react";
import { useProfileAwardWrite as useProfileWrite } from "@/lib/hooks/useProfileAwardWrite";
import ProfileLocation from "../inputs/ProfileLocation";

const CompleteProfileForm = ({ langData, professionData }: any) => {
  const { user, setUser } = useUserContext();
  const router = useRouter();
  const write = useProfileWrite(user.currentUserId);
  const uploads = useRef(new Map<File, UploadedFile>());
  useEffect(() => {
    uploads.current = new Map();
  }, [user.currentUserId]);
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
      location: "",
      firstName: "",
      lastName: "",
      knownLanguage: "",
      profession: "",
      dob: "",
      gender: undefined,
      quotes: "",
      coverPhoto: undefined,
      profilePhoto: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof CompleteProfileValidation>) {
    const formData = {
      firstName: values.firstName,
      lastName: values.lastName,
      dob: values.dob,
      gender: values.gender,
      languageKnown: values.knownLanguage,
      profileImage: undefined as string | undefined,
      coverImage: undefined as string | undefined,
      shortBio: values.quotes,
      professional: values.profession,
      location: values.location,
      latitude: values.latitude,
      longitude: values.longitude,
    };
    const cache = uploads.current;
    await write.run(
      async (active) => {
        const uploadPhoto = async (
          file: File | null | undefined,
          prefix: string,
          label: string,
        ) => {
          if (!file || !active()) return;
          const existing = cache.get(file);
          if (existing) return existing.url;
          try {
            const uploaded = await uploadFileToStorage(
              file,
              prefix,
              user.currentUserId,
            );
            if (!active()) return;
            cache.set(file, uploaded);
            return uploaded.url;
          } catch {
            throw new Error(
              `Unable to upload your ${label}. Your details are still here; please try again.`,
            );
          }
        };
        try {
          formData.profileImage = await uploadPhoto(
            values.profilePhoto,
            "profile-pic",
            "profile photo",
          );
          if (!active()) return;
          formData.coverImage = await uploadPhoto(
            values.coverPhoto,
            "cover-pic",
            "cover photo",
          );
          if (!active()) return;
          const result = await completeProfileAction(formData);
          if (
            active() &&
            result &&
            "fieldErrors" in result &&
            result.fieldErrors
          ) {
            const fields: Record<
              string,
              keyof z.infer<typeof CompleteProfileValidation>
            > = {
              firstName: "firstName",
              lastName: "lastName",
              dob: "dob",
              gender: "gender",
              languageKnown: "knownLanguage",
              professional: "profession",
              shortBio: "quotes",
              location: "location",
              latitude: "latitude",
              longitude: "longitude",
              profileImage: "profilePhoto",
              coverImage: "coverPhoto",
            };
            for (const [key, messages] of Object.entries(result.fieldErrors)) {
              const field = fields[key];
              if (field && messages?.[0])
                form.setError(field, { message: messages[0] });
            }
          }
          return result;
        } catch (error) {
          return {
            status: "400",
            message:
              error instanceof Error
                ? error.message
                : "Unable to create your profile. Please try again.",
          };
        }
      },
      () => {
        setUser({
          currentUserId: user.currentUserId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: user.username,
          email: user.email,
          imageUrl: formData.profileImage ?? null,
          isTalent: false,
        });
        toast.success("Profile Created Successfully", { duration: 5000 });
        router.push("/onboarding");
      },
    );
  }

  return (
    <>
      {write.pending && <TransparentLoader text="Submitting Form" />}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, () =>
            write.setError(
              "Please check the highlighted fields before creating your profile.",
            ),
          )}
          className="mt-4 flex w-full flex-col gap-5"
          aria-busy={write.pending}
        >
          <fieldset disabled={write.pending} className="contents">
            <div className="flex w-full flex-col gap-6">
              <FormField
                control={form.control}
                name="coverPhoto"
                render={({ field }) => (
                  <>
                    <CoverPhoto fieldChange={field.onChange} />
                    <FormMessage
                      id="complete-profile-cover-error"
                      role="alert"
                      className="shad-auth_form_message"
                    />
                  </>
                )}
              />
              <FormField
                control={form.control}
                name="profilePhoto"
                render={({ field }) => (
                  <>
                    <ProfilePhoto fieldChange={field.onChange} />
                    <FormMessage
                      id="complete-profile-photo-error"
                      role="alert"
                      className="shad-auth_form_message"
                    />
                  </>
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

              <ProfileLocation form={form} />

              <CheckboxInput
                form={form}
                inputName="gender"
                formLabel="Gender"
                data={GENDER_VALUES}
              />

              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <>
                    <DateInput
                      formLabel="Date of Birth"
                      fieldChange={field.onChange}
                      isoDate={form.getValues("dob")}
                    />
                    <FormMessage className="shad-auth_form_message -mt-4" />
                  </>
                )}
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

            {write.error && (
              <p
                role="alert"
                className="text-sm text-red-700 dark:text-red-300"
              >
                {write.error}
              </p>
            )}
            <div className="flex w-full justify-end">
              <Button
                type="submit"
                disabled={write.pending || form.formState.isSubmitting}
                className="shad-button_primary mt-4 w-40"
              >
                {write.pending || form.formState.isSubmitting
                  ? "Creating Profile..."
                  : "Create Profile"}
              </Button>
            </div>
          </fieldset>
        </form>
      </Form>
    </>
  );
};

export default CompleteProfileForm;

"use client";

import { userPersonalInfoEditAction } from "@/actions/user.action";
import { EditPersonalInfoForm, EditProInfoForm } from "@/components/forms";
// import { TransparentLoader } from "@/components/modals";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { AUTH_USER_CACHE_KEY, useUserContext } from "@/context/AuthProvider";
import { prepareProfileEditPayload } from "@/lib/utils/profile-editor";
import { useProfileAwardWrite as useProfileDetailWrite } from "@/lib/hooks/useProfileAwardWrite";
import { uploadFileToStorage, type UploadedFile } from "@/lib/utils/uploadFile";
import { getEditProfileValidation } from "@/lib/validations/profile.validation";
import { TCurrentUserData } from "@/types/profile.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { normalizeProfileBirthDate } from "@/lib/utils/birth-date";
import {
  getProfileLocationValues,
  getProfileLocationUpdate,
} from "@/lib/utils/profileLocation";

type Props = {
  langData: any;
  professionData: any;
  userData: TCurrentUserData;
};

const UNFINISHED_SOCIAL_LINK =
  "You have an unfinished social link. Click OK to add it, or Clear to discard it, before updating your profile.";

const EditProfileForm = ({ langData, professionData, userData }: Props) => {
  const router = useRouter();
  const { user, setUser } = useUserContext();
  const write = useProfileDetailWrite(userData._id);
  const { setError: setWriteError } = write;
  const socialDraft = useRef(false);
  const onSocialDraftChange = useCallback(
    (pending: boolean) => {
      socialDraft.current = pending;
      if (!pending)
        setWriteError((previous) =>
          previous === UNFINISHED_SOCIAL_LINK ? "" : previous,
        );
    },
    [setWriteError],
  );
  const uploads = useRef(new Map<File, UploadedFile>());
  const profilePath = `/profile/${encodeURIComponent(userData.userName || user.username)}/${userData._id}`;
  const [prevURLs, setPrevURLs] = useState<string[]>(
    userData?.morePersonalInfo?.featuredPhotos || [],
  );

  const isTalent = userData?.isTalent === true;
  const validationSchema = getEditProfileValidation(isTalent);

  const form = useForm<z.infer<typeof validationSchema>>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      ...getProfileLocationValues(userData),
      firstName: userData?.personalInfo.firstName || "",
      lastName: userData?.personalInfo.lastName || "",
      knownLanguage: userData?.personalInfo.languageKnown || "",
      profession: userData?.personalInfo.professionalId || "",
      dob: normalizeProfileBirthDate(userData?.personalInfo?.dob),
      gender: userData?.personalInfo.gender || "",
      quotes: userData?.personalInfo.shortBio || "",
      coverPhoto: undefined,
      profilePhoto: undefined,
      // professional info
      bio: userData?.morePersonalInfo?.bio || "",
      ethnic: userData?.morePersonalInfo?.ethnicId || "",
      featuredPhotos: [],
      socialLinks: userData?.morePersonalInfo?.socialLinks || [],
    },
  });

  const onInvalid = () =>
    write.setError("Please check the highlighted fields before saving.");

  async function onSubmit(values: z.infer<typeof validationSchema>) {
    if (isTalent && socialDraft.current) {
      write.setError(UNFINISHED_SOCIAL_LINK);
      return;
    }
    try {
      getProfileLocationUpdate(userData, values);
    } catch {
      form.setError("location", { message: "Please select a valid location." });
      write.setError("Please select a valid location.");
      return;
    }
    let savedPayload:
      | Awaited<ReturnType<typeof prepareProfileEditPayload>>
      | undefined;
    await write.run(
      async (active) => {
        try {
          savedPayload = await prepareProfileEditPayload(
            values,
            userData,
            prevURLs,
            uploadFileToStorage,
            uploads.current,
            active,
            !!form.formState.dirtyFields.ethnic,
          );
          if (!active()) return;
          return await userPersonalInfoEditAction(savedPayload, userData._id);
        } catch (error) {
          return {
            status: "400",
            message:
              error instanceof Error
                ? error.message
                : "Unable to update your profile. Please try again.",
          };
        }
      },
      () => {
        try {
          sessionStorage.removeItem(AUTH_USER_CACHE_KEY);
        } catch {}
        setUser((previous) =>
          previous.currentUserId === userData._id
            ? {
                ...previous,
                firstName: values.firstName,
                lastName: values.lastName,
                imageUrl: savedPayload?.profileImage ?? previous.imageUrl,
              }
            : previous,
        );
        toast.success("Profile updated successfully!", { duration: 4000 });
        router.push(profilePath);
        router.refresh();
      },
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        className="w-full"
        aria-busy={write.pending}
      >
        <fieldset disabled={write.pending} className="min-w-0">
          <EditPersonalInfoForm
            form={form}
            userData={userData}
            langData={langData}
            professionData={professionData}
          />
          {isTalent && (
            <EditProInfoForm
              onDraftChange={onSocialDraftChange}
              form={form}
              userData={userData}
              prevURLs={prevURLs}
              setPrevURLs={setPrevURLs}
            />
          )}
        </fieldset>
        {write.error ? (
          <p
            role="alert"
            className="mt-4 text-sm text-red-700 dark:text-red-300"
          >
            {write.error}
          </p>
        ) : null}
        <div className="my-3 mb-5 flex w-full justify-end gap-3">
          <Button
            className="shad-button_secondary w-40"
            type="button"
            disabled={write.pending}
            onClick={() => router.push(profilePath)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={write.pending || form.formState.isSubmitting}
            className="shad-button_primary w-40"
          >
            {write.pending || form.formState.isSubmitting
              ? "Updating Profile..."
              : "Update Profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditProfileForm;

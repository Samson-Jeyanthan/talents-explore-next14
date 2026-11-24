"use client";

import { MyPhotosInput, SocialMediaInput, TextArea } from "../inputs";
import ProfileEthnicityInput from "../inputs/ProfileEthnicityInput";
import { FormField, FormMessage } from "../ui/form";

const EditProInfoForm = ({
  form,
  userData,
  prevURLs,
  setPrevURLs,
  isTalentRegister,
  onDraftChange,
}: any) => {
  return (
    <div
      className={`${isTalentRegister ? "" : "mt-8"} flex w-full flex-col gap-6`}
    >
      <div className="mt-4 flex w-full max-w-screen-md flex-col gap-6">
        {!isTalentRegister && (
          <h2 className="w-full border-b border-dark-400 pb-3 text-xl font-medium text-light-800">
            More details about you
          </h2>
        )}
        <TextArea
          form={form}
          formLabel={isTalentRegister ? "Bio" : "Bio (optional)"}
          inputName="bio"
          placeholder="About your self, your work, and your experience"
          formDescription="This will be displayed on your profile and will help others understand more about you."
          maxLength={1000}
          className="h-60"
        />
        <ProfileEthnicityInput form={form} userData={userData} />
        <FormField
          control={form.control}
          name="featuredPhotos"
          render={({ field }) => (
            <>
              <MyPhotosInput
                prevURLs={prevURLs}
                setPrevURLs={setPrevURLs}
                values={field.value || []}
                fieldChange={field.onChange}
              />
              <FormMessage className="shad-auth_form_message" />
            </>
          )}
        />
        <FormField
          control={form.control}
          name="socialLinks"
          render={({ field }) => (
            <SocialMediaInput
              onDraftChange={onDraftChange}
              fieldChange={field.onChange}
              values={form.getValues("socialLinks")}
            />
          )}
        />
      </div>
    </div>
  );
};

export default EditProInfoForm;

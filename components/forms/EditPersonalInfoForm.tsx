"use client";

import { getProfileGenderOptions } from "@/lib/utils/profile-gender";
import {
  CheckboxInput,
  CoverPhoto,
  DateInput,
  FormInput,
  ProfilePhoto,
  TextArea,
} from "../inputs";
import { FormField, FormMessage } from "../ui/form";
import ProfileLocation from "../inputs/ProfileLocation";
import ProfileOptionField from "../inputs/ProfileOptionField";

const EditPersonalInfoForm = ({
  form,
  userData,
  langData,
  professionData,
}: any) => {
  return (
    <div className="mt-4 flex w-full flex-col gap-5">
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

        <ProfileLocation form={form} />

        <CheckboxInput
          form={form}
          inputName="gender"
          formLabel="Gender"
          data={getProfileGenderOptions(form.watch("gender"))}
        />

        <FormField
          control={form.control}
          name="dob"
          render={({ field }) => (
            <>
              <DateInput
                formLabel="Date of Birth"
                minimumAge={13}
                fieldChange={field.onChange}
                isoDate={form.getValues("dob")}
              />
              <FormMessage className="shad-auth_form_message -mt-4" />
            </>
          )}
        />

        <ProfileOptionField
          form={form}
          kind="language"
          initialResult={langData}
          selectedLabel={userData?.personalInfo?.language}
          savedId={userData?.personalInfo?.languageKnown}
        />
        <ProfileOptionField
          form={form}
          kind="profession"
          initialResult={professionData}
          selectedLabel={userData?.personalInfo?.professional}
          savedId={userData?.personalInfo?.professionalId}
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
    </div>
  );
};

export default EditPersonalInfoForm;

import { GENDER_VALUES } from "@/constants";
import React from "react";
import {
  CheckboxInput,
  CoverPhoto,
  DateInput,
  Dropdown,
  FormInput,
  ProfilePhoto,
  TextArea,
} from "../inputs";
import { FormField } from "../ui/form";

const EditPersonalInfoForm = ({
  form,
  userData,
  LangOptions,
  professionOptions,
}: any) => {
  return (
    <form className="mt-4 flex w-full flex-col gap-5">
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
          isoDate={userData?.personalInfo?.dob}
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
          inputName="profession"
          formLabel="Profession"
          placeholder="Select your profession"
          options={professionOptions}
          value={form.getValues("profession")}
          formDescription="This information helps us understand your professional background and can be used to provide you with relevant content and services."
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
    </form>
  );
};

export default EditPersonalInfoForm;

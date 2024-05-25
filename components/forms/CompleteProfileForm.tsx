"use client";

import React from "react";
import { Form } from "../ui/form";
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
import { CompleteProfileValidation } from "@/lib/validations/authValidation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const CompleteProfileForm = () => {
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
      coverPhoto: [],
      profilePhoto: [],
    },
  });

  function onSubmit(values: z.infer<typeof CompleteProfileValidation>) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mt-4 flex w-full flex-col gap-5"
      >
        <div className="relative flex w-full">
          <CoverPhoto />
          <ProfilePhoto />
        </div>
        <div className="mt-20 flex w-full max-w-screen-md flex-col gap-6">
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
            formLabel="Known Language"
            inputName="knownLanguage"
            placeholder="Select your native language"
            formDescription="Let us know the language you speak so we can connect you with people who share your interests and culture."
            options={[
              { id: "1", name: "English" },
              { id: "2", name: "French" },
              { id: "3", name: "Spanish" },
            ]}
          />
          <Dropdown
            form={form}
            value={form.getValues("profession")}
            formLabel="Profession"
            inputName="profession"
            placeholder="Select your profession"
            formDescription="This information helps us understand your professional background and can be used to provide you with relevant content and services."
            options={[
              { id: "1", name: "English" },
              { id: "2", name: "French" },
              { id: "3", name: "Spanish" },
            ]}
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
            Complete Profile
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CompleteProfileForm;

"use client";

import React from "react";
import { Button } from "../ui/button";
import { Dropdown, FormInput } from "../inputs";
import useDateSelector from "@/lib/hooks/useDateSelector";

const EducationEditForm = ({
  isEdit,
  form,
  onSubmit,
  pending = false,
  error,
}: any) => {
  const { years } = useDateSelector({});

  const YEARS = years.map((item) => ({
    _id: String(item.id),
    name: item.label,
  }));

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <fieldset
        disabled={pending}
        aria-busy={pending}
        className="flex min-w-0 flex-col gap-5"
      >
        <FormInput
          form={form}
          inputName="course"
          placeholder="Course Name"
          inputType="text"
          formLabel="Course Name"
        />
        <FormInput
          form={form}
          inputName="institution"
          placeholder="Institution Name"
          inputType="text"
          formLabel="Institution Name"
        />
        <div className="-mt-1 flex flex-col gap-1">
          <p className="text-[13px] text-light-800">From - To</p>
          <div className="flex gap-2">
            <Dropdown
              form={form}
              value={form.getValues("from")}
              inputName="from"
              placeholder="From"
              options={YEARS}
              isModal={true}
            />
            <Dropdown
              form={form}
              value={form.getValues("to")}
              inputName="to"
              placeholder="To"
              options={[{ _id: "present", name: "Present" }, ...YEARS]}
              isModal={true}
            />
          </div>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={pending || form.formState.isSubmitting}
          className="shad-button_primary"
        >
          {pending || form.formState.isSubmitting
            ? isEdit
              ? "Updating..."
              : "Adding..."
            : isEdit
              ? "Update"
              : "Add"}
        </Button>
      </fieldset>
    </form>
  );
};

export default EducationEditForm;

"use client";

import React from "react";
import { Button } from "../ui/button";
import { Dropdown, FormInput } from "../inputs";
import useDateSelector from "@/lib/hooks/useDateSelector";

const EductionEditForm = ({ isEdit, form, options, onSubmit }: any) => {
  const { years } = useDateSelector({});

  const YEARS = years.map((item) => ({
    _id: item.id,
    name: item.label,
  }));

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={form.handleSubmit(onSubmit)}
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
            options={YEARS}
            isModal={true}
          />
        </div>
      </div>
      <Button
        disabled={form.formState.isSubmitting}
        className="shad-button_primary"
      >
        {form.formState.isSubmitting
          ? isEdit === "languageEdit"
            ? "Updating..."
            : "Adding..."
          : isEdit === "languageEdit"
            ? "Update"
            : "Add"}
      </Button>
    </form>
  );
};

export default EductionEditForm;

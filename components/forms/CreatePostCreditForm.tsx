"use client";

import { CREDIT_WORK_OPTIONS } from "@/constants";
import {
  CheckboxInput,
  CreditTagInput,
  DateInput,
  FormInput,
  UsedToolsInput,
} from "../inputs";
import { FormField, FormMessage } from "../ui/form";
import { ToolTip } from "../others";

const CreatePostCreditForm = ({ form }: any) => {
  return (
    <form
      className="flex w-full flex-col gap-6"
      // onSubmit={(e) => e.preventDefault()}
    >
      <div className="flex flex-col gap-2 border-y border-dark-400 py-4 text-light-800">
        <p className="mb-1 text-sm">
          We value your contribution. Use the checkboxes to specify your role
          &apos;Credit Work&apos; if you took part, or &apos;Full
          Ownership&apos; if it&apos;s your sole creation.
        </p>
        <CheckboxInput
          form={form}
          inputName="isCreditWork"
          data={CREDIT_WORK_OPTIONS}
        />
      </div>

      <FormField
        control={form.control}
        name="credit"
        render={({ field }) => (
          <CreditTagInput
            fieldChange={field.onChange}
            values={form.getValues("credit")}
          />
        )}
      />

      <div className="flex flex-col gap-2">
        <ToolTip
          title="Production Info"
          description="Add the production name and production date when applicable. This provides context about when and where the work was created and helps keep your portfolio organized."
        />
        <FormInput
          form={form}
          inputName="productionName"
          inputType="text"
          placeholder="Production Name"
        />
        <FormField
          control={form.control}
          name="productionDate"
          render={({ field }) => (
            <>
              <DateInput
                formLabel="Production Date"
                fieldChange={field.onChange}
                isoDate={form.getValues("productionDate")}
              />
              <FormMessage className="shad-auth_form_message -mt-4" />
            </>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="toolsUsed"
        render={({ field }) => (
          <UsedToolsInput
            fieldChange={field.onChange}
            values={form.getValues("toolsUsed")}
          />
        )}
      />
    </form>
  );
};

export default CreatePostCreditForm;

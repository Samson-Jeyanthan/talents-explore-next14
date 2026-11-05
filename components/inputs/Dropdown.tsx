"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";

type Props = {
  form: any;
  formLabel?: string;
  inputName: string;
  placeholder?: string;
  options: { _id: string | number; name: string | number }[];
  value: string | boolean | number | null | undefined;
  formDescription?: string;
  // it is usefull for skils and countries related onChanges, bcz it is dependent on another field
  dependentFieldPlaceholder?: string;
  dependentFieldValue?: boolean;
  onValueChange?: (_id: string) => {};
  resetFiled?: () => void;
  isModal?: boolean;
};

const Dropdown = ({
  form,
  formLabel,
  inputName,
  placeholder,
  options,
  value,
  formDescription,
  dependentFieldPlaceholder,
  dependentFieldValue,
  onValueChange,
  resetFiled,
  isModal,
}: Props) => {
  const [selectedValue, setSelectedValue] = useState(value || "");

  useEffect(() => {
    setSelectedValue(value || "");
  }, [value]);

  const handleOnChange = (_id: string, field: any) => {
    field.onChange(_id);
    console.log(_id);
    onValueChange?.(_id);
    setSelectedValue(_id);
  };

  return (
    <FormField
      control={form.control}
      name={inputName}
      render={({ field }) => (
        <FormItem className={`${isModal ? "-mt-2" : ""} w-full`}>
          {formLabel && (
            <FormLabel className="shad-auth_form_label">{formLabel}</FormLabel>
          )}
          <FormControl>
            <Select
              value={selectedValue as string}
              onValueChange={(_id: string) => handleOnChange(_id, field)}
            >
              <SelectTrigger className="shad-auth_form_input capitalize">
                {options?.find((option) => option._id === selectedValue)
                  ?.name || <SelectValue />}

                {!selectedValue && (
                  <p className="flex w-full items-start text-light-500">
                    {placeholder}
                  </p>
                )}
              </SelectTrigger>
              <SelectContent
                className={`${isModal ? "!z-[150]" : ""} shad-auth_form_select_option`}
              >
                {dependentFieldPlaceholder && !dependentFieldValue && (
                  <div className="shad-auth_form_select_item flex items-center pl-2 text-sm">
                    --{dependentFieldPlaceholder}--
                  </div>
                )}
                {options?.length > 0 &&
                  options?.map((option, index) => (
                    <SelectItem
                      key={index}
                      value={String(option._id)}
                      className="shad-auth_form_select_item capitalize"
                    >
                      {option.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage className="shad-auth_form_message" />
          {formDescription && (
            <FormDescription className="text-[13px] text-light-600">
              {formDescription}
            </FormDescription>
          )}
        </FormItem>
      )}
    />
  );
};

export default Dropdown;

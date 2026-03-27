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
import { useState } from "react";

type Props = {
  form: any;
  formLabel?: string;
  inputName: string;
  placeholder?: string;
  options: { _id: string; name: string }[];
  value: string | boolean | undefined;
  formDescription?: string;
  // it is usefull for skils and countries related onChanges, bcz it is dependent on another field
  dependentFieldPlaceholder?: string;
  dependentFieldValue?: boolean;
  onValueChange?: (_id: string) => {};
  resetFiled?: () => void;
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
}: Props) => {
  const [selectedValue, setSelectedValue] = useState(value || "");

  const handleOnChange = (_id: string, field: any) => {
    field.onChange(_id);
    setSelectedValue(_id);
    onValueChange && onValueChange(_id);
  };

  return (
    <FormField
      control={form.control}
      name={inputName}
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel className="shad-auth_form_label">{formLabel}</FormLabel>
          <FormControl>
            <Select onValueChange={(_id: string) => handleOnChange(_id, field)}>
              <SelectTrigger className="flex-between shad-auth_form_input">
                {options?.find((option) => option._id === selectedValue)
                  ?.name || <SelectValue />}

                {!selectedValue && (
                  <p className="flex w-full items-start text-light-500">
                    {placeholder}
                  </p>
                )}
              </SelectTrigger>
              <SelectContent className="shad-auth_form_select_option">
                {dependentFieldPlaceholder && !dependentFieldValue && (
                  <div className="shad-auth_form_select_item flex items-center pl-2 text-sm">
                    --{dependentFieldPlaceholder}--
                  </div>
                )}
                {options?.length > 0 &&
                  options?.map((option, index) => (
                    <SelectItem
                      key={index}
                      value={option?._id && option?._id}
                      className="shad-auth_form_select_item"
                    >
                      {option?.name}
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

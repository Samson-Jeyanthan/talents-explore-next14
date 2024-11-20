"use client";

import useDateSelector from "@/lib/hooks/useDateSelector";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useState } from "react";

type TDropdownProps = {
  form: any;
  formLabel?: string;
  yearName: string;
  monthName: string;
  dayName: string;
  yearValue: any;
  monthValue: any;
  dayValue: any;
  formDescription?: string;
};

const DateInput = ({
  form,
  formLabel,
  yearName,
  monthName,
  dayName,
  yearValue,
  monthValue,
  dayValue,
}: TDropdownProps) => {
  const [dates, setDates] = useState({
    selectedYear: "",
    selectedMonth: "",
  });
  const { years, months, days } = useDateSelector({
    yearValue: dates.selectedYear,
    monthValue: dates.selectedMonth,
  });

  return (
    <div>
      {formLabel && (
        <FormLabel className="shad-auth_form_label">{formLabel}</FormLabel>
      )}
      <div className="flex-center w-full gap-4">
        <FormField
          control={form.control}
          name={yearName}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <Select
                  onValueChange={(id: string) => {
                    field.onChange(id);
                    setDates({
                      ...dates,
                      selectedYear: id,
                    });
                  }}
                >
                  <SelectTrigger className="flex-between shad-auth_form_input">
                    <SelectValue />
                    {!yearValue && (
                      <p className="flex w-full items-start text-light-500">
                        Year
                      </p>
                    )}
                  </SelectTrigger>
                  <SelectContent className="shad-auth_form_select_option">
                    {years.map((option, index) => (
                      <SelectItem
                        key={index}
                        value={String(option.id)}
                        className="shad-auth_form_select_item"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={monthName}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <Select
                  onValueChange={(id: string) => {
                    field.onChange(id);
                    setDates({
                      ...dates,
                      selectedMonth: id,
                    });
                  }}
                >
                  <SelectTrigger className="flex-between shad-auth_form_input">
                    <SelectValue />
                    {!monthValue && (
                      <p className="flex w-full items-start text-light-500">
                        Month
                      </p>
                    )}
                  </SelectTrigger>
                  <SelectContent className="shad-auth_form_select_option">
                    {months.map((option, index) => (
                      <SelectItem
                        key={index}
                        value={String(option.id)}
                        className="shad-auth_form_select_item"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={dayName}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <Select onValueChange={(id: any) => field.onChange(id)}>
                  <SelectTrigger className="flex-between shad-auth_form_input">
                    <SelectValue />
                    {!dayValue && (
                      <p className="flex w-full items-start text-light-500">
                        Day
                      </p>
                    )}
                  </SelectTrigger>
                  {days.length > 0 && (
                    <SelectContent className="shad-auth_form_select_option">
                      {days.map((option, index) => (
                        <SelectItem
                          key={index}
                          value={option.id}
                          className="shad-auth_form_select_item"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  )}
                </Select>
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="year"
        render={({ field }) => (
          <FormMessage className="shad-auth_form_message mt-2" />
        )}
      />
    </div>
  );
};

export default DateInput;

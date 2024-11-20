"use client";

import useDateSelector, {
  formatDateOfBirth,
} from "@/lib/hooks/useDateSelector";
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

type Props = {
  form: any;
  formLabel?: string;
  // input names for dat. bcz in a single form there can be multiple date inputs
  yearName: string;
  monthName: string;
  dayName: string;
  formDescription?: string;
  isoDate?: string;
};

const DateInput = ({
  form,
  formLabel,
  yearName,
  monthName,
  dayName,
  isoDate,
}: Props) => {
  const { year, month, day } = formatDateOfBirth(isoDate);

  const [dates, setDates] = useState({
    selectedYear: year || "",
    selectedMonth: month || "",
    selectedDay: day || "",
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
                    {years?.find((year) => year.id === dates.selectedYear)
                      ?.label || <SelectValue />}
                    {!dates.selectedYear && (
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
                    {months?.find(
                      (year) => year.id === String(dates.selectedMonth)
                    )?.label || <SelectValue />}
                    {!dates.selectedMonth && (
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
                <Select
                  onValueChange={(id: any) => {
                    field.onChange(id);
                    setDates({
                      ...dates,
                      selectedDay: id,
                    });
                  }}
                >
                  <SelectTrigger className="flex-between shad-auth_form_input">
                    {days?.find(
                      (day) => day.label === String(dates.selectedDay)
                    )?.label || <SelectValue />}
                    {!dates.selectedDay ||
                      (!days?.some(
                        (day) => day.label === String(dates.selectedDay)
                      ) && (
                        <p className="flex w-full items-start text-light-500">
                          Day
                        </p>
                      ))}
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

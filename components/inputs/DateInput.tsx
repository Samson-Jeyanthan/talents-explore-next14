"use client";

import useDateSelector, {
  convertToISOString,
  formatISOStringDate,
} from "@/lib/hooks/useDateSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useEffect, useState } from "react";

type Props = {
  formLabel?: string;
  formDescription?: string;
  isoDate?: string;
  fieldChange: (value: string) => void;
};

const DateInput = ({
  formLabel,
  formDescription,
  fieldChange,
  isoDate,
}: Props) => {
  const { year, month, day } = formatISOStringDate(isoDate);

  const [dates, setDates] = useState({
    selectedYear: String(year) || "",
    selectedMonth: String(month) || "",
    selectedDay: String(day) || "",
  });
  const { years, months, days } = useDateSelector({
    yearValue: dates.selectedYear,
    monthValue: Number(dates.selectedMonth),
    dayValue: dates.selectedDay,
  });

  const handleDropdownChange = () => {
    const convertedDate = convertToISOString(
      dates.selectedYear,
      dates.selectedMonth,
      dates.selectedDay
    );
    fieldChange(convertedDate);
  };

  useEffect(() => {
    if (
      dates.selectedYear !== "" &&
      dates.selectedMonth !== "" &&
      dates.selectedDay !== ""
    ) {
      handleDropdownChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dates]);

  return (
    <div className="flex w-full flex-col gap-2">
      {formLabel && <p className="shad-auth_form_label">{formLabel}</p>}
      <div className="flex-center w-full gap-4">
        <Select
          onValueChange={(id: string) => {
            setDates({
              ...dates,
              selectedYear: id,
            });
          }}
        >
          <SelectTrigger className="flex-between shad-auth_form_input">
            {years?.find(
              (year) => Number(year.id) === Number(dates.selectedYear)
            )?.label || <SelectValue />}
            {!dates.selectedYear && (
              <p className="flex w-full items-start text-light-500">Year</p>
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

        <Select
          onValueChange={(id: string) => {
            setDates({
              ...dates,
              selectedMonth: id,
            });
          }}
        >
          <SelectTrigger className="flex-between shad-auth_form_input">
            {months?.find(
              (month) => Number(month.id) === Number(dates.selectedMonth)
            )?.label || <SelectValue />}
            {!dates.selectedMonth && (
              <p className="flex w-full items-start text-light-500">Month</p>
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

        <Select
          onValueChange={(id: any) => {
            setDates({
              ...dates,
              selectedDay: id,
            });
          }}
        >
          <SelectTrigger className="flex-between shad-auth_form_input">
            {days?.find((day) => day.id === dates.selectedDay)?.label || (
              <SelectValue />
            )}
            {!dates.selectedDay ||
              (!days?.some((day) => day.id === dates.selectedDay) && (
                <p className="flex w-full items-start text-light-500">Day</p>
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
      </div>
    </div>
  );
};

export default DateInput;

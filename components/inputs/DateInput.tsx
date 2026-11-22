"use client";

import useDateSelector from "@/lib/hooks/useDateSelector";
import {
  convertToISOString,
  formatISOStringDate,
} from "@/lib/utils/birth-date";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useEffect, useRef, useState } from "react";

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
  const lastEmitted = useRef<string | null>(null);
  const { years, months, days } = useDateSelector({
    yearValue: dates.selectedYear,
    monthValue: Number(dates.selectedMonth),
  });

  // Reflect loaded/reset values without writing back on mount or prop changes.
  useEffect(() => {
    if (isoDate === lastEmitted.current) {
      lastEmitted.current = null;
      return;
    }
    const incoming = formatISOStringDate(isoDate);
    setDates({
      selectedYear: incoming.year,
      selectedMonth: incoming.month,
      selectedDay: incoming.day,
    });
  }, [isoDate]);

  const selectDate = (part: keyof typeof dates, value: string) => {
    const next = { ...dates, [part]: value };
    let iso = convertToISOString(
      next.selectedYear,
      next.selectedMonth,
      next.selectedDay,
    );
    if (!iso && part !== "selectedDay") next.selectedDay = "";
    iso = convertToISOString(
      next.selectedYear,
      next.selectedMonth,
      next.selectedDay,
    );
    setDates(next);
    // Clear the submitted value while incomplete, so a stale DOB cannot be saved.
    lastEmitted.current = iso;
    fieldChange(iso);
  };

  return (
    <div className="flex w-full flex-col gap-2">
      {formLabel && <p className="shad-auth_form_label">{formLabel}</p>}
      <div className="flex-center w-full gap-4">
        <Select
          value={dates.selectedYear}
          onValueChange={(id: string) => selectDate("selectedYear", id)}
        >
          <SelectTrigger
            aria-label={`${formLabel || "Date"} year`}
            className="flex-between shad-auth_form_input"
          >
            {years?.find(
              (year) => Number(year.id) === Number(dates.selectedYear),
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
          value={dates.selectedMonth}
          onValueChange={(id: string) => selectDate("selectedMonth", id)}
        >
          <SelectTrigger
            aria-label={`${formLabel || "Date"} month`}
            className="flex-between shad-auth_form_input"
          >
            {months?.find(
              (month) => Number(month.id) === Number(dates.selectedMonth),
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
          value={dates.selectedDay}
          disabled={days.length === 0}
          onValueChange={(id: string) => selectDate("selectedDay", id)}
        >
          <SelectTrigger
            aria-label={`${formLabel || "Date"} day`}
            className="flex-between shad-auth_form_input"
          >
            {days?.find((day) => Number(day.id) === Number(dates.selectedDay))
              ?.label || <SelectValue />}
            {!dates.selectedDay && (
              <p className="flex w-full items-start text-light-500">Day</p>
            )}
          </SelectTrigger>
          {days.length > 0 && (
            <SelectContent className="shad-auth_form_select_option">
              {days.map((option, index) => (
                <SelectItem
                  key={index}
                  value={String(option.id)}
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

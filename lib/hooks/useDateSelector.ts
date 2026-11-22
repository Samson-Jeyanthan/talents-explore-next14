"use client";

import { useMemo } from "react";
import { getDaysInMonth } from "../utils/birth-date";

export { convertToISOString, formatISOStringDate } from "../utils/birth-date";

type TDateSelectorProps = {
  yearValue?: any;
  monthValue?: any;
  dayValue?: any;
};

type TDays = {
  id: string;
  label: string;
};

const useDateSelector = ({ yearValue, monthValue }: TDateSelectorProps) => {
  const currentYear = new Date().getFullYear();

  // get years function
  const years = useMemo(() => {
    const years = [];
    for (let i = currentYear; i > 1900; i--) {
      years.push({ id: i, label: i.toString() });
    }
    return years;
  }, [currentYear]);

  const presentAddedYears = useMemo(() => {
    const years = [];
    years.push({ id: "Present", label: 0 });
    for (let i = currentYear; i > 1900; i--) {
      years.push({ id: i, label: i.toString() });
    }
    return years;
  }, [currentYear]);

  // get months function
  const months = useMemo(() => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return monthNames.map((name, index) => ({
      id: (index + 1).toString().padStart(2, "0"),
      label: name,
    }));
  }, []);

  const days = useMemo(() => {
    const daysInMonth = getDaysInMonth(Number(yearValue), Number(monthValue));
    const calDays: TDays[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      calDays.push({
        id: i.toString().padStart(2, "0"),
        label: i.toString(),
      });
    }

    return calDays;
  }, [yearValue, monthValue]);

  return {
    presentAddedYears,
    years,
    months,
    days,
    getDaysInMonth,
  };
};

export default useDateSelector;

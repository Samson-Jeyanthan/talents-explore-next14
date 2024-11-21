"use client";

import { useEffect, useMemo, useState } from "react";

type TDateSelectorProps = {
  isPresent?: boolean;
  yearValue: any;
  monthValue: any;
  dayValue: any;
};

type TDays = {
  id: string;
  label: string;
};

const useDateSelector = ({
  isPresent,
  yearValue,
  monthValue,
  dayValue,
}: TDateSelectorProps) => {
  const currentYear = new Date().getFullYear();

  // get years function
  const years = useMemo(() => {
    const years = [];
    if (isPresent) {
      years.push({ id: "Present", label: 0 });
    }
    for (let i = currentYear; i > 1900; i--) {
      years.push({ id: i, label: i.toString() });
    }
    return years;
  }, [currentYear, isPresent]);

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

  // find out leap years' and normal years' days
  const getDaysInMonth = (year: number, month: number): number => {
    const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

    const daysInMonth: { [key: string]: number } = {
      1: 31,
      2: isLeapYear ? 29 : 28,
      3: 31,
      4: 30,
      5: 31,
      6: 30,
      7: 31,
      8: 31,
      9: 30,
      10: 31,
      11: 30,
      12: 31,
    };

    return daysInMonth[month];
  };

  // setting the days in array regarding of selected month & year
  const [days, setDays] = useState<TDays[]>([]);
  useEffect(() => {
    // console.log(yearValue, monthValue, "from hook");
    const daysInMonth = getDaysInMonth(
      parseInt(yearValue),
      parseInt(monthValue)
    );
    const calDays: TDays[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      calDays.push({
        id: i.toString().padStart(2, "0"),
        label: i.toString(),
      });
    }

    setDays(calDays);
  }, [yearValue, monthValue, dayValue]);

  return {
    years,
    months,
    days,
    getDaysInMonth,
  };
};

export default useDateSelector;

// function to convert the date to ISO string
export function convertToISOString(
  year: string,
  month: string,
  day: string
): string {
  // Create a new Date object with the given year, month, and day
  const y = parseInt(year);
  const m = parseInt(month);
  const d = parseInt(day);
  const date = new Date(Date.UTC(y, m - 1, d));

  // Return the ISO string representation of the date
  return date.toISOString();
}

// function to extract the year, month, and day from the date
export const formatISOStringDate = (dob: string | undefined) => {
  if (!dob) {
    return { year: "", month: "", day: "" };
  }
  const date = new Date(dob);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // Months are 0-based, so add 1
  const day = date.getDate();

  return { year, month, day };
};

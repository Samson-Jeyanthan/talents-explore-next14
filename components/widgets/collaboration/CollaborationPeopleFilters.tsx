"use client";
import { useState } from "react";
import LookupSelect from "@/components/inputs/SearchLookupSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GENDER_VALUES,
  LEVEL_VALUES,
  TIME_DURATION_FILTERS,
} from "@/constants";

const empty = {
  mainCategoryId: "",
  subCategoryId: "",
  skillId: "",
  level: "",
  userRating: "",
  userGender: "",
  userLanguage: "",
  ethnic: "",
  country: "",
  state: "",
  resultTime: "",
};
export default function CollaborationPeopleFilters({
  disabled,
  loading,
  onApply,
}: {
  disabled: boolean;
  loading: boolean;
  onApply: (query: any) => void;
}) {
  const [search, setSearch] = useState("");
  const [values, setValues] = useState(empty);
  const change = (key: keyof typeof empty, value: string) =>
    setValues((previous) => ({
      ...previous,
      [key]: value,
      ...(key === "mainCategoryId"
        ? { subCategoryId: "", skillId: "", level: "" }
        : {}),
      ...(key === "subCategoryId" ? { skillId: "", level: "" } : {}),
      ...(key === "country" ? { state: "" } : {}),
    }));
  const select = (
    key: keyof typeof empty,
    label: string,
    options: { value: string; label: string }[],
  ) => (
    <label className="grid gap-2 text-sm text-light-700">
      {label}
      <select
        className="shad-form-input"
        value={values[key]}
        onChange={(event) => change(key, event.target.value)}
      >
        <option value="">Any {label.toLowerCase()}</option>
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled)
          onApply({
            ...Object.fromEntries(
              Object.entries(values).map(([key, value]) => [
                key,
                key === "userRating"
                  ? value === ""
                    ? null
                    : Number(value)
                  : value || null,
              ]),
            ),
            searchText: search.trim(),
          });
      }}
      className="rounded-3xl border border-dark-300 bg-dark-250 p-5"
    >
      <fieldset disabled={disabled} className="grid min-w-0 gap-4">
        <label className="grid gap-2 text-sm text-light-700">
          Search people
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name or username"
          />
        </label>
        <details>
          <summary className="cursor-pointer text-sm text-light-700">
            Filter people
          </summary>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <LookupSelect
              label="Main category"
              kind="categories"
              value={values.mainCategoryId}
              onChange={(value) => change("mainCategoryId", value)}
            />
            <LookupSelect
              label="Subcategory"
              kind="subcategories"
              parent={values.mainCategoryId}
              value={values.subCategoryId}
              onChange={(value) => change("subCategoryId", value)}
            />
            <LookupSelect
              label="Skill"
              kind="skills"
              parent={values.subCategoryId}
              value={values.skillId}
              onChange={(value) => change("skillId", value)}
            />
            {select(
              "level",
              "Level",
              LEVEL_VALUES.map((item) => ({
                value: item._id,
                label: item.name,
              })),
            )}
            <label className="grid gap-2 text-sm text-light-700">
              Minimum public rating
              <Input
                type="number"
                min="0"
                max="5"
                step="0.5"
                value={values.userRating}
                onChange={(event) => change("userRating", event.target.value)}
              />
            </label>
            {select(
              "userGender",
              "Gender",
              GENDER_VALUES.map((item) => ({
                value: item.id,
                label: item.name,
              })),
            )}
            <LookupSelect
              label="Language"
              kind="languages"
              value={values.userLanguage}
              onChange={(value) => change("userLanguage", value)}
            />
            <LookupSelect
              label="Ethnicity"
              kind="ethnic"
              value={values.ethnic}
              onChange={(value) => change("ethnic", value)}
            />
            <LookupSelect
              label="Country"
              kind="countries"
              value={values.country}
              onChange={(value) => change("country", value)}
            />
            <LookupSelect
              label="State"
              kind="states"
              parent={values.country}
              value={values.state}
              onChange={(value) => change("state", value)}
            />
            {select(
              "resultTime",
              "Joined within",
              TIME_DURATION_FILTERS.map((item) => ({
                value: item.id,
                label: item.name,
              })),
            )}
          </div>
        </details>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            Search
          </Button>
          <Button
            type="button"
            onClick={() => {
              setValues(empty);
              setSearch("");
              onApply({ searchText: "" });
            }}
          >
            Clear filters
          </Button>
        </div>
      </fieldset>
    </form>
  );
}

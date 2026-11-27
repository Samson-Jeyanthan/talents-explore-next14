"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import LookupSelect from "@/components/inputs/SearchLookupSelect";
import {
  buildExploreQuery,
  clearExploreFilters,
  getExploreFilterValues,
  replaceExploreFilters,
  type ExploreType,
  type FilterField,
  type LookupKind,
} from "@/lib/utils/explore";
import StarRating from "@/components/inputs/StarRating";
import { Button } from "@/components/ui/button";

export default function ExploreFilters({
  type,
  onClose,
}: {
  type: ExploreType;
  onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const route = useParams();
  const category =
    pathname.startsWith("/category/") && typeof route.id === "string"
      ? route.id
      : "";
  const query = params.toString();
  const [values, setValues] = useState(() => ({
    ...getExploreFilterValues(query),
    ...(category ? { mainCategory: category } : {}),
  }));
  const [error, setError] = useState("");
  const id = useId();
  useEffect(() => {
    setValues({
      ...getExploreFilterValues(query),
      ...(category ? { mainCategory: category } : {}),
    });
    setError("");
  }, [query, category]);
  function change(key: FilterField, value: string) {
    setValues((current) => ({
      ...current,
      [key]: value,
      ...(key === "mainCategory"
        ? { subCategory: "", skill: "", level: "" }
        : {}),
      ...(key === "subCategory" ? { skill: "", level: "" } : {}),
      ...(key === "country" ? { state: "" } : {}),
    }));
  }
  function navigate(next: string) {
    router.push(`${pathname}${next ? `?${next}` : ""}`, { scroll: false });
    onClose();
  }
  function apply(event: FormEvent) {
    event.preventDefault();
    const next = replaceExploreFilters(query, values);
    try {
      buildExploreQuery(type, next);
      navigate(next);
    } catch {
      setError(
        "Some filter values are invalid. Check your selections or clear the filters.",
      );
    }
  }
  function text(key: FilterField, label: string, placeholder?: string) {
    return (
      <div className="flex flex-col gap-2">
        <label
          htmlFor={`${id}-${key}`}
          className="text-sm font-medium text-light-700"
        >
          {label}
        </label>
        <input
          id={`${id}-${key}`}
          value={values[key]}
          onChange={(event) => change(key, event.target.value)}
          placeholder={placeholder}
          className="shad-form-input w-full"
        />
      </div>
    );
  }
  function lookup(
    key: FilterField,
    label: string,
    kind: LookupKind,
    parent = "",
    disabled = false,
  ) {
    return (
      <LookupSelect
        label={label}
        value={values[key]}
        onChange={(value) => change(key, value)}
        kind={kind}
        parent={parent}
        shared={type === "SHARE"}
        disabled={disabled}
      />
    );
  }
  function stars(
    key: "publicRating" | "privateRating" | "profileRating",
    label: string,
  ) {
    const number = Number(values[key] || 0);
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-light-700">{label}</p>
        <StarRating
          key={key}
          ratingFor="FILTER"
          prevRatingValue={Number.isFinite(number) ? number : 0}
          authorId=""
          revalidatePath=""
          onChange={(value) => change(key, String(value))}
        />
      </div>
    );
  }
  return (
    <form onSubmit={apply} className="flex w-full flex-col gap-5">
      {lookup("mainCategory", "Main category", "categories", "", !!category)}
      {lookup(
        "subCategory",
        "Subcategory",
        "subcategories",
        values.mainCategory,
      )}
      {lookup("skill", "Skill", "skills", values.subCategory)}
      <div className="flex flex-col gap-2">
        <label
          htmlFor={`${id}-level`}
          className="text-sm font-medium text-light-700"
        >
          Skill level
        </label>
        <select
          id={`${id}-level`}
          value={values.level}
          onChange={(event) => change("level", event.target.value)}
          className="shad-form-input w-full"
        >
          <option value="">Any level</option>
          {["beginner", "intermediate", "advanced"].map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>
      {text("keywords", "Keywords", "Separate keywords with commas")}
      {text("postDescription", "Description contains")}
      {type === "TALENT" ? (
        <>
          {stars("profileRating", "Minimum profile rating")}
          <div className="flex flex-col gap-2">
            <label
              htmlFor={`${id}-gender`}
              className="text-sm font-medium text-light-700"
            >
              Gender
            </label>
            <select
              id={`${id}-gender`}
              value={values.gender}
              onChange={(event) => change("gender", event.target.value)}
              className="shad-form-input w-full"
            >
              <option value="">Any gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefferNotToSay">Prefer not to say</option>
            </select>
          </div>
          {lookup("userEthnicity", "Ethnicity", "ethnic")}
          {lookup("userLanguage", "Language", "languages")}
        </>
      ) : (
        <>
          {stars("publicRating", "Minimum public rating")}
          {stars("privateRating", "Minimum rating given by you")}
          {lookup("primaryLanguage", "Primary language", "languages")}
          {lookup("secondaryLanguage", "Secondary language", "languages")}
          <div className="flex flex-col gap-2">
            <label
              htmlFor={`${id}-time`}
              className="text-sm font-medium text-light-700"
            >
              Published within
            </label>
            <select
              id={`${id}-time`}
              value={values.timeDuration}
              onChange={(event) => change("timeDuration", event.target.value)}
              className="shad-form-input w-full"
            >
              <option value="">Any time</option>
              {[
                ["one month", "One month"],
                ["six month", "Six months"],
                ["one year", "One year"],
                ["two year", "Two years"],
              ].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
      {lookup("country", "Country", "countries")}
      {lookup("state", "Town", "states", values.country)}
      {text("creditTitle", "Credit title")}
      {error && (
        <p role="alert" className="text-sm text-primary-500">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-3 border-t border-dark-400 pt-4">
        <Button
          type="button"
          className="shad-button_secondary"
          onClick={() => navigate(clearExploreFilters(query))}
        >
          Clear filters
        </Button>
        <Button type="submit" className="shad-button_primary">
          Apply filters
        </Button>
      </div>
    </form>
  );
}

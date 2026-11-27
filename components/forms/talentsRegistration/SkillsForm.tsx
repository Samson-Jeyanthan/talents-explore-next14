"use client";

import { useProfileSkillOptions } from "@/lib/hooks/useProfileSkillOptions";
import { registrationSkillValidation } from "@/lib/utils/talent-registration";
import { parseSkillHashtags } from "@/lib/utils/profile-skills";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/inputs";
import { Button } from "@/components/ui/button";
import { LEVEL_VALUES } from "@/constants";
import { ChevronRight, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { MdDelete } from "react-icons/md";

type SkillRow = { skillId: string; skill: string; level: string };
type SkillSet = {
  mainCategory: string;
  mainCategoryId: string;
  subCategory: string;
  subCategoryId: string;
  skillsHave: SkillRow[];
  description: string;
  hashTags: string[];
};

const EMPTY_ROW: SkillRow = { skillId: "", skill: "", level: "" };

const SkillsForm = ({ form, isTalentRegister, page, onDraftChange }: any) => {
  const [skills, setSkills] = useState({
    mainCategory: "",
    subCategory: "",
    skillsHave: [{ skillId: "", level: "" }],
    description: "",
    hashtags: "",
  });
  const [addedSkills, setAddedSkills] = useState<SkillSet[]>(
    form.getValues("skillSets") || [],
  );
  const [error, setError] = useState("");
  const main = useProfileSkillOptions("main", "", page === 1);
  const sub = useProfileSkillOptions("sub", skills.mainCategory, page === 1);
  const availableSkills = useProfileSkillOptions(
    "skill",
    skills.subCategory,
    page === 1,
  );
  const mainCategoryOptions = main.options;
    const subCategoryOptions = sub.options;
    const skillOptions = availableSkills.options;
  const ready =
    main.status === "ready" &&
    sub.status === "ready" &&
    availableSkills.status === "ready";
  const hasDraft = !!(
    skills.mainCategory ||
    skills.subCategory ||
    skills.description ||
    skills.hashtags ||
    skills.skillsHave.some((row) => row.skillId || row.level)
  );
  useEffect(() => {
    onDraftChange?.(hasDraft);
  }, [hasDraft, onDraftChange]);
  const clear = () => {
    setSkills({
      mainCategory: "",
      subCategory: "",
      skillsHave: [{ skillId: "", level: "" }],
      description: "",
      hashtags: "",
    });
    setError("");
  };
  const fetchSubcategories = (mainCategory: string) =>
    setSkills((previous) => ({
      ...previous,
      mainCategory,
      subCategory: "",
      skillsHave: [{ skillId: "", level: "" }],
    }));
  const fetchSkills = (subCategory: string) =>
    setSkills((previous) => ({
      ...previous,
      subCategory,
      skillsHave: [{ skillId: "", level: "" }],
    }));
  // Update a row, and automatically push an empty row when the last one is complete
  async function autoAddSkillsLevel(
    index: number,
    field: keyof SkillRow,
    value: string,
  ) {
    setSkills((prev) => {
      const nextRows = prev.skillsHave.map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      );

      const isLast = index === nextRows.length - 1;
      const last = nextRows[nextRows.length - 1];
      const hasMoreSkills = nextRows.length < skillOptions.length;

      if (isLast && last?.skillId && last?.level && hasMoreSkills) {
        nextRows.push({ ...EMPTY_ROW });
      }

      // BUG FIX: return the whole skills object, not just the rows array
      return { ...prev, skillsHave: nextRows };
    });
  }

  function removeRow(index: number) {
    setSkills((prev) => {
      const nextRows = prev.skillsHave.filter((_, i) => i !== index);
      return {
        ...prev,
        skillsHave: nextRows.length ? nextRows : [{ ...EMPTY_ROW }],
      };
    });
  }

  // Hide skills already picked in other rows so the same skill can't be added twice
  function optionsForRow(index: number) {
    const takenIds = skills.skillsHave
      .filter((_, i) => i !== index)
      .map((row) => row.skillId);
    return skillOptions.filter((opt) => !takenIds.includes(opt._id));
  }

  const handleAddClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!ready) {
      setError(
        "Wait for the category choices to load, or retry the failed request.",
      );
      return;
    }
    const rows = skills.skillsHave.filter((row) => row.skillId || row.level);
    const parsed = registrationSkillValidation.safeParse({
      mainCategoryId: skills.mainCategory,
      subCategoryId: skills.subCategory,
      skillsHave: rows,
      description: skills.description,
      hashTags: parseSkillHashtags(skills.hashtags),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    if (
      (skillOptions.length > 0 && !rows.length) ||
      rows.some(
        (row) => !skillOptions.some((option) => option._id === row.skillId),
      ) ||
      !mainCategoryOptions.some(
        (option) => option._id === skills.mainCategory,
      ) ||
      !subCategoryOptions.some((option) => option._id === skills.subCategory)
    ) {
      setError(
        "Choose available categories and add each skill with its level.",
      );
      return;
    }
    const newSet: SkillSet = {
      mainCategory: mainCategoryOptions.find(
        (row) => row._id === skills.mainCategory,
      )!.name,
      mainCategoryId: skills.mainCategory,
      subCategory: subCategoryOptions.find(
        (row) => row._id === skills.subCategory,
      )!.name,
      subCategoryId: skills.subCategory,
      skillsHave: rows.map((row) => ({
        ...row,
        skill: skillOptions.find((option) => option._id === row.skillId)!.name,
      })),
      description: parsed.data.description,
      hashTags: parsed.data.hashTags,
    };
    const next = [...addedSkills, newSet];
    setAddedSkills(next);
    form.setValue("skillSets", next, { shouldValidate: true });
    clear();
  };

  function removeAddedSkills(index: number) {
    const next = addedSkills.filter((_, i) => i !== index);
    setAddedSkills(next);
    form?.setValue?.("skillSets", next);
  }

  return (
    <div className="flex min-h-[90%] flex-col justify-between gap-6 md:flex-row">
      <div
        className={`${isTalentRegister ? "mt-6 w-full md:w-[45%]" : "w-full"} flex min-w-0 flex-col gap-4`}
      >
        <Dropdown
          form={form}
          inputName="mainCategory"
          placeholder="Select Main Category"
          options={mainCategoryOptions}
          value={skills.mainCategory}
          onValueChange={(_id: string) => fetchSubcategories(_id)}
        />
        <Dropdown
          form={form}
          inputName="subCategory"
          placeholder="Select Sub Category"
          options={subCategoryOptions}
          value={skills.subCategory}
          onValueChange={(_id: string) => fetchSkills(_id)}
          dependentFieldPlaceholder="Please select main category"
          dependentFieldValue={skills.mainCategory !== ""}
        />

        {skills.subCategory &&
          availableSkills.status === "ready" &&
          skillOptions.length > 0 &&
          skills.skillsHave.map((row, index) => (
            <div className="relative flex min-w-0 gap-6 pr-6" key={index}>
              <Dropdown
                form={form}
                inputName={`skills.skillsHave${index}.skillId`}
                placeholder="Select Skill"
                options={optionsForRow(index)}
                value={row.skillId}
                dependentFieldPlaceholder={"Please select sub category"}
                dependentFieldValue={skills.subCategory !== ""}
                onValueChange={(_id: string) =>
                  autoAddSkillsLevel(index, "skillId", _id)
                }
              />
              <Dropdown
                form={form}
                inputName={`skills.skillsHave${index}.level`}
                placeholder="Select level"
                options={LEVEL_VALUES}
                value={row.level}
                onValueChange={(value: string) =>
                  autoAddSkillsLevel(index, "level", value)
                }
              />
              {skills.skillsHave.length !== 1 && (
                <button
                  type="button"
                  aria-label={`Remove skill ${index+1}`}
                  onClick={() => removeRow(index)}
                  className="flex-center absolute right-0 top-3 size-5 cursor-pointer rounded-full border border-light-500 p-[2px] text-light-600 hover:text-light-850"
                >
                  <X />
                </button>
              )}
            </div>
          ))}

        {[
          main,
          ...(skills.mainCategory ? [sub] : []),
          ...(skills.subCategory ? [availableSkills] : []),
        ].map((choices, index) =>
          choices.status === "error" ? (
            <div
              role="alert"
              key={index}
              className="text-sm text-red-700 dark:text-red-300"
            >
              {choices.error}
              <Button type="button" variant="ghost" onClick={choices.retry}>
                Try again
              </Button>
            </div>
          ) : choices.status === "loading" ? (
            <p key={index} role="status" className="text-xs text-light-500">
              Loading choices...
            </p>
          ) : null,
        )}
        <textarea
          aria-label="Skill description"
          value={skills.description}
          onChange={(event) =>
            setSkills((previous) => ({
              ...previous,
              description: event.target.value,
            }))
          }
          placeholder="Describe your skill"
          maxLength={500}
          className="shad-auth_form_textarea h-48"
        />
        <Input
          aria-label="Skill hashtags"
          value={skills.hashtags}
          onChange={(event) =>
            setSkills((previous) => ({
              ...previous,
              hashtags: event.target.value,
            }))
          }
          placeholder="#talent #explorer"
          className="shad-auth_form_input"
        />
        {error ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        ) : null}
        <p className="text-sm text-light-850">
          Click Add Skill to add this entry before selecting Next.
        </p>
        <div className="flex w-full flex-wrap items-center gap-3">
          <Button
            type="button"
            disabled={!ready}
            onClick={handleAddClick}
            className="shad-button_primary !h-auto min-h-11 flex-1 !whitespace-normal font-semibold !text-white"
          >
            Add Skill
          </Button>
          <button
            type="button"
            aria-label="Clear skill entry"
            disabled={!hasDraft}
            onClick={clear}
            className="min-h-11 px-2 text-sm text-light-850 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 disabled:opacity-50"
          >
            Clear
          </button>
        </div>
      </div>
      {isTalentRegister && (
        <div className="mt-6 flex w-full min-w-0 flex-col gap-4 md:w-1/2">
          <h3 className="border-b border-dark-400 pb-2 text-light-850">
            Added Skills {addedSkills.length}
          </h3>

          {addedSkills.map((set, index) => (
            <article
              key={index}
              className="relative rounded-md bg-dark-300 p-3"
            >
              <p className="flex items-center gap-2 text-sm text-light-850">
                {set.mainCategory} <ChevronRight className="size-4" />{" "}
                {set.subCategory}
              </p>

              <ul className="mt-2 flex flex-wrap gap-2">
                {set.skillsHave.map((s) => (
                  <li
                    key={s.skillId}
                    className="rounded-full border border-gray-700 px-3 py-1 text-sm text-light-500"
                  >
                    {s.skill} - {s.level}
                  </li>
                ))}
              </ul>

              <p className="mt-2 text-sm text-light-500">{set.description}</p>
              <p className="mt-2 text-xs text-light-500">
                {set.hashTags.join(" ")}
              </p>

              <button
                type="button"
                aria-label={`Remove ${set.subCategory}`}
                className="absolute right-2 top-2 cursor-pointer text-lg text-light-900"
                onClick={() => removeAddedSkills(index)}
              >
                <MdDelete />
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillsForm;

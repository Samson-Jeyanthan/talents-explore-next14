"use client";

import {
  getMainCategoriesAction,
  getSkillsAction,
  getSubCategoriesAction,
} from "@/actions/utils.action";
import { Dropdown, TextArea } from "@/components/inputs";
import { Button } from "@/components/ui/button";
import { LEVEL_VALUES } from "@/constants";
import { ChevronRight, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { MdDelete } from "react-icons/md";

type SkillRow = { skillId: string; skill: string; level: string };
type SelectOption = { _id: string; name: string };
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

const SkillsForm = ({ form, isTalentRegister, page }: any) => {
  const [mainCategoryOptions, setMainCategoryOption] = useState<SelectOption[]>(
    []
  );
  const [subCategoryOptions, setSubCategoryOptions] = useState<SelectOption[]>(
    []
  );
  const [skillOptions, setSkillOptions] = useState<SelectOption[]>([]);
  const [skills, setSkills] = useState({
    mainCategory: "",
    subCategory: "",
    skillsHave: [
      {
        skillId: "",
        level: "",
      },
    ],
    description: "",
    hashTags: [],
  });
  const [addedSkills, setAddedSkills] = useState<SkillSet[]>(
    form.getValues("skillSets") || []
  );

  const mapOptions = (res: any) =>
    (res?.response || []).map((item: any) => ({
      _id: item._id,
      name: item.name,
    }));

  async function fetchMainCategories() {
    const res = await getMainCategoriesAction();
    setMainCategoryOption(mapOptions(res));
  }

  async function fetchSubcategories(mainCategory: string) {
    setSubCategoryOptions([]);
    setSkillOptions([]);
    setSkills({
      ...skills,
      mainCategory,
    });
    try {
      const res = await getSubCategoriesAction(mainCategory);
      setSubCategoryOptions(mapOptions(res));
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async function fetchSkills(subCategory: string) {
    setSkillOptions([]);
    setSkills({
      ...skills,
      subCategory,
    });
    try {
      const res = await getSkillsAction(subCategory);
      const nextSkillOptions = mapOptions(res);

      setSkillOptions(nextSkillOptions);
      if (nextSkillOptions.length === 0) {
        setSkills({
          ...skills,
          skillsHave: [],
        });
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  useEffect(() => {
    if (page === 1) fetchMainCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Update a row, and automatically push an empty row when the last one is complete
  async function autoAddSkillsLevel(
    index: number,
    field: keyof SkillRow,
    value: string
  ) {
    setSkills((prev) => {
      const nextRows = prev.skillsHave.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
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

    const completeRows = skills.skillsHave.filter((r) => r.skillId && r.level);
    if (
      !skills.mainCategory ||
      !skills.subCategory ||
      completeRows.length === 0
    )
      return;

    const newSet: SkillSet = {
      mainCategory:
        mainCategoryOptions.find((o) => o._id === skills.mainCategory)?.name ??
        skills.mainCategory,
      mainCategoryId: skills.mainCategory,
      subCategory:
        subCategoryOptions.find((o) => o._id === skills.subCategory)?.name ??
        skills.subCategory,
      subCategoryId: skills.subCategory,
      skillsHave: completeRows.map((row) => ({
        ...row,
        skill:
          skillOptions.find((o) => o._id === row.skillId)?.name ?? row.skillId,
        skillId: row.skillId,
        level:
          (LEVEL_VALUES as any[]).find((l) => (l._id ?? l.value) === row.level)
            ?.name ?? row.level,
      })),
      description: skills.description ?? "",
      hashTags: [],
    };

    setAddedSkills((prev) => {
      const next = [...prev, newSet];
      // keep react-hook-form in sync if your schema has this field
      form.setValue?.("skillSets", next);
      return next;
    });

    console.log(form.getValues("skillSets"));
  };

  function removeAddedSkills(index: number) {
    const next = addedSkills.filter((_, i) => i !== index);
    setAddedSkills(next);
    form?.setValue?.("skillSets", next);
  }

  return (
    <div className="flex min-h-[90%] justify-between gap-6">
      <form
        className={`${isTalentRegister ? "mt-6 w-[45%]" : "w-full"} flex flex-col gap-4`}
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

        {skills.skillsHave.map((row, index) => (
          <div className="relative flex gap-6" key={index}>
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
              <span
                onClick={() => removeRow(index)}
                className="flex-center absolute -right-8 top-3 size-5 cursor-pointer rounded-full border border-light-500 p-[2px] text-light-600 hover:text-light-850"
              >
                <X />
              </span>
            )}
          </div>
        ))}

        <TextArea
          form={form}
          inputName={skills.description}
          placeholder="Describe your skill"
          maxLength={500}
          className="h-48"
          onChange={(e) => {
            setSkills({
              ...skills,
              description: e.target.value,
            });
          }}
        />

        <div className="flex w-full justify-end">
          <Button
            onClick={handleAddClick}
            className="shad-button_secondary !w-32 !text-custom-100"
          >
            Add Skill
          </Button>
        </div>
      </form>
      {isTalentRegister && (
        <div className="mt-6 flex w-1/2 flex-col gap-4">
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

              <span
                className="absolute right-2 top-2 cursor-pointer text-lg text-white"
                onClick={() => removeAddedSkills(index)}
              >
                <MdDelete />
              </span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillsForm;

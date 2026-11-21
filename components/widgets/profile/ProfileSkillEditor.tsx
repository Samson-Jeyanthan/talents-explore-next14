"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { saveProfileSkillAction } from "@/actions/profile-skills.action";
import { useProfileSkillOptions } from "@/lib/hooks/useProfileSkillOptions";
import { useProfileAwardWrite as useProfileDetailWrite } from "@/lib/hooks/useProfileAwardWrite";
import {
  parseSkillHashtags,
  profileSkillValidation,
  skillSetKey,
  SKILL_LEVELS,
  type ProfileSkill,
} from "@/lib/utils/profile-skills";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function draft(row?: ProfileSkill) {
  return {
    mainCategoryId: row?.mainCategoryId || "",
    subCategoryId: row?.subCategoryId || "",
    skillsHave:
      row?.skillsHave.map((item) => ({
        skillId: item.skillId,
        level: item.level.toLowerCase(),
      })) || [],
    description: row?.description || "",
    hashtags: (row?.hashTags || []).join(" "),
  };
}

type Choices = ReturnType<typeof useProfileSkillOptions>;
function ChoiceStatus({ choices }: { choices: Choices }) {
  if (choices.status === "loading")
    return (
      <p role="status" className="text-xs text-light-500">
        Loading choices...
      </p>
    );
  if (choices.status === "error")
    return (
      <div role="alert" className="text-sm text-red-700 dark:text-red-300">
        <p>{choices.error}</p>
        <Button type="button" variant="ghost" onClick={choices.retry}>
          Try again
        </Button>
      </div>
    );
  return null;
}

export default function ProfileSkillEditor({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data?: ProfileSkill;
}) {
  const params = useParams<{ userId: string }>();
  const router = useRouter();
  const selection = data ? skillSetKey(data) : "new";
  const write = useProfileDetailWrite(
    `${params.userId}:${selection}:${isOpen}`,
  );
  const [values, setValues] = useState(() => draft(data));
  const initial = useRef(data);
  initial.current = data;
  useEffect(() => {
    if (isOpen) setValues(draft(initial.current));
  }, [isOpen, selection, params.userId]);
  const main = useProfileSkillOptions("main", "", isOpen);
  const sub = useProfileSkillOptions("sub", values.mainCategoryId, isOpen);
  const skills = useProfileSkillOptions("skill", values.subCategoryId, isOpen);
  const ready =
    main.status === "ready" &&
    sub.status === "ready" &&
    skills.status === "ready";
  const selectedTags = parseSkillHashtags(values.hashtags);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!ready) {
      write.setError(
        "Wait for the category choices to load, or retry the failed request.",
      );
      return;
    }
    const result = profileSkillValidation.safeParse({
      ...values,
      hashTags: selectedTags,
      skillsHave: values.skillsHave.filter((row) => row.skillId || row.level),
    });
    if (!result.success) {
      write.setError(result.error.issues[0].message);
      return;
    }
    if (
      !main.options.some((row) => row._id === values.mainCategoryId) ||
      !sub.options.some((row) => row._id === values.subCategoryId) ||
      result.data.skillsHave.some(
        (row) => !skills.options.some((option) => option._id === row.skillId),
      )
    ) {
      write.setError(
        "A selected category or skill is no longer available. Choose an available option.",
      );
      return;
    }
    if (skills.options.length && !result.data.skillsHave.length) {
      write.setError("Add at least one skill and its proficiency level.");
      return;
    }
    await write.run(
      () =>
        saveProfileSkillAction({
          profileId: params.userId,
          ...(data ? { skillSetId: selection } : {}),
          skill: result.data,
        }),
      () => {
        onClose();
        router.refresh();
      },
    );
  };
  const updateRow = (
    index: number,
    field: "skillId" | "level",
    value: string,
  ) =>
    setValues((current) => ({
      ...current,
      skillsHave: current.skillsHave.map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      ),
    }));
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !write.pending) onClose();
      }}
    >
      <DialogContent
        className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl border-dark-400 bg-dark-250 text-light-900"
        onEscapeKeyDown={(event) => {
          if (write.pending) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (write.pending) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{data ? "Edit skills" : "Add skills"}</DialogTitle>
          <DialogDescription>
            Choose your categories, skills and levels, then add a description
            and hashtags.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <fieldset
            disabled={write.pending}
            aria-busy={write.pending}
            className="grid min-w-0 gap-4"
          >
            <label className="grid gap-2 text-sm">
              Main category *
              <select
                name="mainCategoryId"
                className="shad-auth_form_input w-full"
                value={values.mainCategoryId}
                disabled={main.status !== "ready"}
                onChange={(event) => {
                  setValues((current) => ({
                    ...current,
                    mainCategoryId: event.target.value,
                    subCategoryId: "",
                    skillsHave: [],
                  }));
                  write.setError("");
                }}
              >
                <option value="">Choose main category</option>
                {values.mainCategoryId &&
                !main.options.some(
                  (row) => row._id === values.mainCategoryId,
                ) ? (
                  <option value={values.mainCategoryId}>
                    {data?.mainCategoryName || "Selected category"}{" "}
                    (unavailable)
                  </option>
                ) : null}
                {main.options.map((row) => (
                  <option key={row._id} value={row._id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </label>
            <ChoiceStatus choices={main} />
            <label className="grid gap-2 text-sm">
              Subcategory *
              <select
                name="subCategoryId"
                className="shad-auth_form_input w-full"
                value={values.subCategoryId}
                disabled={!values.mainCategoryId || sub.status !== "ready"}
                onChange={(event) => {
                  setValues((current) => ({
                    ...current,
                    subCategoryId: event.target.value,
                    skillsHave: [],
                  }));
                  write.setError("");
                }}
              >
                <option value="">Choose subcategory</option>
                {values.subCategoryId &&
                !sub.options.some((row) => row._id === values.subCategoryId) ? (
                  <option value={values.subCategoryId}>
                    {data?.subCategoryName || "Selected subcategory"}{" "}
                    (unavailable)
                  </option>
                ) : null}
                {sub.options.map((row) => (
                  <option key={row._id} value={row._id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </label>
            {values.mainCategoryId ? <ChoiceStatus choices={sub} /> : null}
            {values.subCategoryId ? <ChoiceStatus choices={skills} /> : null}
            {values.subCategoryId && skills.status === "ready" ? (
              <div className="grid min-w-0 gap-3 rounded-2xl border border-dark-400 p-3">
                <p className="text-sm">Skills &amp; proficiency</p>
                {values.skillsHave.map((row, index) => (
                  <div
                    key={index}
                    className="grid min-w-0 gap-2 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    <label className="grid min-w-0 gap-1 text-xs">
                      Skill {index + 1}
                      <select
                        aria-label={`Skill ${index + 1}`}
                        className="shad-auth_form_input w-full"
                        value={row.skillId}
                        onChange={(event) =>
                          updateRow(index, "skillId", event.target.value)
                        }
                      >
                        <option value="">Choose skill</option>
                        {row.skillId &&
                        !skills.options.some(
                          (option) => option._id === row.skillId,
                        ) ? (
                          <option value={row.skillId}>
                            {data?.skillsHave.find(
                              (item) => item.skillId === row.skillId,
                            )?.skillName || "Selected skill"}{" "}
                            (unavailable)
                          </option>
                        ) : null}
                        {skills.options
                          .filter(
                            (option) =>
                              !values.skillsHave.some(
                                (other, i) =>
                                  i !== index && other.skillId === option._id,
                              ),
                          )
                          .map((option) => (
                            <option key={option._id} value={option._id}>
                              {option.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="grid min-w-0 gap-1 text-xs">
                      Level {index + 1}
                      <select
                        aria-label={`Level ${index + 1}`}
                        className="shad-auth_form_input w-full capitalize"
                        value={row.level}
                        onChange={(event) =>
                          updateRow(index, "level", event.target.value)
                        }
                      >
                        <option value="">Choose level</option>
                        {SKILL_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      className="self-end"
                      aria-label={`Remove skill ${index + 1}`}
                      onClick={() =>
                        setValues((current) => ({
                          ...current,
                          skillsHave: current.skillsHave.filter(
                            (_, i) => i !== index,
                          ),
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                {skills.options.length ? (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={values.skillsHave.length >= skills.options.length}
                    onClick={() =>
                      setValues((current) => ({
                        ...current,
                        skillsHave: [
                          ...current.skillsHave,
                          { skillId: "", level: "" },
                        ],
                      }))
                    }
                  >
                    Add skill &amp; level
                  </Button>
                ) : (
                  <p className="text-xs text-light-500">
                    No individual skills are listed for this category.
                  </p>
                )}
              </div>
            ) : null}
            <label className="grid gap-2 text-sm">
              Description *
              <textarea
                name="description"
                className="shad-auth_form_input min-h-28 w-full"
                rows={4}
                value={values.description}
                maxLength={10000}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </label>
            <label className="grid gap-2 text-sm">
              Hashtags *
              <input
                name="hashtags"
                className="shad-auth_form_input w-full"
                placeholder="#talent #explorer"
                value={values.hashtags}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    hashtags: event.target.value,
                  }))
                }
              />
            </label>
            {selectedTags.length ? (
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-dark-400 px-2 py-1 text-xs [overflow-wrap:anywhere]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </fieldset>
          {write.error ? (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {write.error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={write.pending}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={write.pending || !ready}
              className="shad-button_primary"
            >
              {write.pending
                ? "Saving..."
                : data
                  ? "Save changes"
                  : "Add skills"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use server";
import { getAuthHeaders } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect";
import {
  skillSetKey,
  profileSkillMutationValidation,
  type ProfileSkill,
  type SkillOption,
} from "@/lib/utils/profile-skills";

type SkillResult =
  | { status: "7400"; response: ProfileSkill[]; message?: string }
  | { status: "400"; response: []; message: string };
async function request(
  path: string,
  headers: Record<string, string>,
  body?: any,
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}${path}`,
    {
      method: body === undefined ? "GET" : "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    },
  );
  const data = await response.json();
  if (!response.ok || data?.status !== "7400")
    throw new Error("Request failed");
  return data.response;
}
async function readSkills(
  profileId: string,
  headers: Record<string, string>,
): Promise<ProfileSkill[]> {
  const rows = await request(`/user/skills/${profileId}`, headers);
  if (
    !Array.isArray(rows) ||
    rows.some(
      (row) =>
        !row ||
        typeof row !== "object" ||
        Array.isArray(row) ||
        typeof row.mainCategoryId !== "string" ||
        typeof row.subCategoryId !== "string" ||
        typeof row.description !== "string" ||
        !Array.isArray(row.skillsHave) ||
        row.skillsHave.some(
          (skill: any) =>
            !skill ||
            typeof skill.skillId !== "string" ||
            typeof skill.level !== "string",
        ) ||
        (row.hashTags != null &&
          (!Array.isArray(row.hashTags) ||
            row.hashTags.some((tag: any) => typeof tag !== "string"))),
    )
  )
    throw new Error("Invalid skills response");
  return rows;
}
export async function getProfileSkillsAction(
  profileId: string,
): Promise<SkillResult> {
  if (!/^[a-f\d]{24}$/i.test(profileId))
    return { status: "400", response: [], message: "Invalid profile." };
  try {
    return {
      status: "7400",
      response: await readSkills(profileId, await getAuthHeaders()),
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: "400",
      response: [],
      message: "Unable to load skill details. Please try again.",
    };
  }
}
async function updateSkills(
  profileId: string,
  skillSetId: string | undefined,
  skill: ProfileSkill | undefined,
): Promise<SkillResult> {
  try {
    const headers = await getAuthHeaders();
    const viewer = await request("/user/", headers);
    if (viewer?._id !== profileId)
      return {
        status: "400",
        response: [],
        message: "You can only update your own skill details.",
      };
    const rows = await readSkills(profileId, headers);
    const matches = skillSetId
      ? rows.filter((row) => skillSetKey(row) === skillSetId)
      : [];
    if (skillSetId && !skill && matches.length === 0) {
      return {
        status: "7400",
        response: rows,
        message: "Skill already deleted.",
      };
    }
    if (skillSetId && matches.length !== 1)
      return {
        status: "400",
        response: [],
        message:
          "This skill has changed or no longer exists. Refresh your profile and try again.",
      };
    if (
      !skillSetId &&
      skill &&
      rows.some(
        (row) =>
          row.mainCategoryId === skill.mainCategoryId &&
          row.subCategoryId === skill.subCategoryId &&
          row.description === skill.description &&
          JSON.stringify(row.hashTags || []) ===
            JSON.stringify(skill.hashTags || []) &&
          JSON.stringify(
            row.skillsHave.map(({ skillId, level }) => ({ skillId, level })),
          ) ===
            JSON.stringify(
              skill.skillsHave.map(({ skillId, level }) => ({
                skillId,
                level,
              })),
            ),
      )
    ) {
      return {
        status: "7400",
        response: rows,
        message: "Skill already saved.",
      };
    }
    const resolved = skill ? await resolveSkill(skill, headers) : undefined;
    const next = skillSetId
      ? rows.flatMap((row) =>
          skillSetKey(row) === skillSetId
            ? resolved
              ? [{ ...row, ...resolved }]
              : []
            : [row],
        )
      : [...rows, resolved!];
    await request("/user/skills", headers, next);
    // A cache refresh failure must not turn an acknowledged save into a retry.
    try {
      revalidatePath("/profile/[username]/[userId]", "layout");
    } catch {}
    return {
      status: "7400",
      response: next,
      message: skillSetId
        ? skill
          ? "Skill updated."
          : "Skill deleted."
        : "Skill added.",
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: "400",
      response: [],
      message:
        "Unable to save skill details. Your information has been retained; please try again.",
    };
  }
}
export async function saveProfileSkillAction(
  payload: unknown,
): Promise<SkillResult> {
  const parsed = profileSkillMutationValidation.safeParse(payload);
  if (!parsed.success)
    return {
      status: "400",
      response: [],
      message:
        "Check the categories, skills, levels, description, and hashtags.",
    };
  return updateSkills(
    parsed.data.profileId,
    parsed.data.skillSetId,
    parsed.data.skill,
  );
}
export async function deleteProfileSkillAction(
  profileId: string,
  skillSetId: string,
): Promise<SkillResult> {
  if (
    !/^[a-f\d]{24}$/i.test(profileId) ||
    typeof skillSetId !== "string" ||
    !skillSetId ||
    skillSetId.length > 20000
  )
    return { status: "400", response: [], message: "Invalid skill." };
  return updateSkills(profileId, skillSetId, undefined);
}

async function readOptions(
  path: string,
  headers: Record<string, string>,
): Promise<SkillOption[]> {
  const rows = await request(path, headers);
  if (
    !Array.isArray(rows) ||
    rows.some(
      (row) =>
        !row || typeof row._id !== "string" || typeof row.name !== "string",
    )
  )
    throw new Error("Invalid category response");
  return rows
    .map(({ _id, name }) => ({ _id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProfileSkillOptionsAction(
  kind: "main" | "sub" | "skill",
  parentId = "",
): Promise<
  | { status: "7400"; response: SkillOption[] }
  | { status: "400"; response: []; message: string }
> {
  if (
    !["main", "sub", "skill"].includes(kind) ||
    (kind !== "main" && !/^[a-f\d]{24}$/i.test(parentId))
  )
    return { status: "400", response: [], message: "Choose a valid category." };
  const path =
    kind === "main"
      ? "/category/mainCategory"
      : kind === "sub"
        ? `/category/subCategory/${parentId}`
        : `/category/skill/${parentId}`;
  try {
    return {
      status: "7400",
      response: await readOptions(path, await getAuthHeaders()),
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: "400",
      response: [],
      message: "Unable to load choices. Please try again.",
    };
  }
}

async function resolveSkill(
  skill: ProfileSkill,
  headers: Record<string, string>,
): Promise<ProfileSkill> {
  const main = await readOptions("/category/mainCategory", headers);
  const category = main.find((row) => row._id === skill.mainCategoryId);
  if (!category) throw new Error("Invalid main category");
  const sub = await readOptions(
    `/category/subCategory/${skill.mainCategoryId}`,
    headers,
  );
  const subCategory = sub.find((row) => row._id === skill.subCategoryId);
  if (!subCategory) throw new Error("Invalid subcategory");
  const options = await readOptions(
    `/category/skill/${skill.subCategoryId}`,
    headers,
  );
  if (
    (options.length > 0 && skill.skillsHave.length === 0) ||
    skill.skillsHave.some(
      (row) => !options.some((option) => option._id === row.skillId),
    )
  )
    throw new Error("Invalid skill selection");
  return {
    ...skill,
    mainCategoryName: category.name,
    subCategoryName: subCategory.name,
    skillsHave: skill.skillsHave.map((row) => ({
      ...row,
      skillName: options.find((option) => option._id === row.skillId)!.name,
    })),
  };
}

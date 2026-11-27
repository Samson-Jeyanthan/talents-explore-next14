"use server";

import { getAuthHeaders } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect";
import { profileLanguageMutationValidation } from "@/lib/utils/profile-languages";
import { profileLanguageRows } from "@/lib/utils/profile-sections";
import { parseProfileOptions } from "@/lib/utils/profile-options";

async function request(
  path: string,
  headers: Record<string, string>,
  body?: unknown,
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
  const result = await response.json();
  if (!response.ok || result?.status !== "7400")
    throw new Error("Language request failed");
  return result.response;
}

export async function saveProfileLanguageAction(payload: unknown) {
  const parsed = profileLanguageMutationValidation.safeParse(payload);
  if (!parsed.success)
    return {
      status: "400",
      message: "Choose a valid language and proficiency level.",
    };
  const { profileId, entryId, language } = parsed.data;
  try {
    const headers = await getAuthHeaders();
    const viewer = await request("/user/", headers);
    if (viewer?.isTalent !== true)
      throw new Error(
        "Become a talent to manage professional profile details.",
      );
    if (viewer?._id !== profileId)
      return {
        status: "400",
        message: "You can only update your own languages.",
      };
    const rows = profileLanguageRows(
      await request(`/user/languages/${profileId}`, headers),
    );
    const matches = entryId ? rows.filter((row) => row._id === entryId) : [];
    if (entryId && matches.length !== 1)
      return {
        status: "400",
        message:
          "This language has changed or no longer exists. Refresh your profile and try again.",
      };
    const duplicate = rows.find(
      (row) => row._id !== entryId && row.languageId === language.languageId,
    );
    if (duplicate) {
      // An acknowledged write may have lost its response. An identical add is safe to retry.
      if (!entryId && duplicate.level === language.level)
        return { status: "7400", message: "Language already saved." };
      return {
        status: "400",
        message:
          "This language is already on your profile. Edit its existing entry instead.",
      };
    }
    let languageName: string;
    if (matches[0]?.languageId === language.languageId)
      languageName = matches[0].languageName;
    else {
      const options = parseProfileOptions(
        { status: "7400", response: await request("/language", headers) },
        "language",
      );
      const selected = options.options.find(
        (option) => option._id === language.languageId,
      );
      if (options.status !== "ready" || !selected)
        return {
          status: "400",
          message:
            "Unable to verify the selected language. Reload the language choices and try again.",
        };
      languageName = selected.name;
    }
    const value = { ...language, languageName };
    const next = entryId
      ? rows.map((row) => (row._id === entryId ? { ...row, ...value } : row))
      : [...rows, value];
    await request("/user/languages", headers, next);
    try {
      revalidatePath("/profile/[username]/[userId]", "layout");
    } catch {
      /* The save was acknowledged. */
    }
    return { status: "7400", message: "Language saved." };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: "400",
      message:
        "Unable to save this language. Your entry is still here; please try again.",
    };
  }
}

export async function deleteProfileLanguageAction(
  profileId: string,
  entryId: string,
) {
  if (
    typeof profileId !== "string" ||
    !/^[a-f\d]{24}$/i.test(profileId) ||
    typeof entryId !== "string" ||
    !entryId.trim() ||
    entryId.length > 4096
  )
    return {
      status: "400",
      message:
        "Invalid language selection. Refresh your profile and try again.",
    };
  try {
    const headers = await getAuthHeaders();
    const viewer = await request("/user/", headers);
    if (viewer?.isTalent !== true)
      throw new Error(
        "Become a talent to manage professional profile details.",
      );
    if (viewer?._id !== profileId)
      return {
        status: "400",
        message: "You can only delete your own languages.",
      };
    const rows = profileLanguageRows(
      await request(`/user/languages/${profileId}`, headers),
    );
    const remaining = rows.filter((row) => row._id !== entryId);
    // Retrying after a lost response must not delete a different entry.
    if (remaining.length !== rows.length)
      await request("/user/languages", headers, remaining);
    try {
      revalidatePath("/profile/[username]/[userId]", "layout");
    } catch {
      /* Server state confirms the deletion. */
    }
    return {
      status: "7400",
      message:
        remaining.length === rows.length
          ? "Language already deleted."
          : "Language deleted.",
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      status: "400",
      message: "Unable to confirm language deletion. Please try again.",
    };
  }
}

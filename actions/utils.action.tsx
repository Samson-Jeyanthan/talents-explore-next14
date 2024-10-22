"use server";

import { ISearchParams } from "@/types/utils.types";

export async function getLanguagesAction() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/language/`
      // cache: "force-cache",
    );
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getProfessionsAction() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/private-info/professional/`
    );
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getMainCategoriesAction() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/category/mainCategory/`
    );
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function searchPeopleTag(
  userId: string | undefined,
  filter: string,
  pageNo: number,
  pageSize: number
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/user/tagging/search?userId=${userId}&pageNo=${pageNo}&pageSize=${20}&filter=${filter}`
    );
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function searchAction({
  searchType,
  userId,
  viewUserId,
  pageNo,
  pageSize,
  searchText,
  mainCategoryId,
  subCategoryId,
  skillId,
  level,
  primaryLanguage,
  secondaryLanguage,
  publicRating,
  privateRating,
  keywords,
  description,
  country,
  state,
  creditTitle,
  creditPeopleTag,
  resultTime,
  userRating,
  userGender,
  ethnic,
  userLanguage,
}: ISearchParams) {
  try {
    // Create URLSearchParams instance for building the query string
    const queryParams = new URLSearchParams();

    queryParams.append("searchType", searchType);
    queryParams.append("userId", userId);
    queryParams.append("pageNo", pageNo.toString());
    queryParams.append("pageSize", pageSize.toString());

    // Optionally append query params if they are provided
    if (viewUserId) queryParams.append("viewUserId", viewUserId);
    if (searchText) queryParams.append("searchText", searchText);
    if (mainCategoryId) queryParams.append("mainCategoryId", mainCategoryId);
    if (subCategoryId) queryParams.append("subCategoryId", subCategoryId);
    if (skillId) queryParams.append("skillId", skillId);
    if (level) queryParams.append("level", level);
    if (primaryLanguage) queryParams.append("primaryLanguage", primaryLanguage);
    if (secondaryLanguage)
      queryParams.append("secondaryLanguage", secondaryLanguage);
    if (publicRating) queryParams.append("publicRating", publicRating);
    if (privateRating) queryParams.append("privateRating", privateRating);
    if (keywords && keywords.length)
      queryParams.append("keywords", keywords.join(","));
    if (description) queryParams.append("description", description);
    if (country) queryParams.append("country", country);
    if (state) queryParams.append("state", state);
    if (creditTitle) queryParams.append("creditTitle", creditTitle);
    if (creditPeopleTag) queryParams.append("creditPeopleTag", creditPeopleTag);
    if (resultTime) queryParams.append("resultTime", resultTime);
    if (userRating !== undefined)
      queryParams.append("userRating", userRating.toString());
    if (userGender) queryParams.append("userGender", userGender);
    if (ethnic) queryParams.append("ethnic", ethnic);
    if (userLanguage) queryParams.append("userLanguage", userLanguage);

    // Make the API request
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/search/?${queryParams.toString()}`
    );

    // Check if the response is okay
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // Handle any errors
    console.error("Search API call failed:", error);
    throw error;
  }
}

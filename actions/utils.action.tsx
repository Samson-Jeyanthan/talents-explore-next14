"use server";

export async function getLanguagesAction() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/language`
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
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/private-info/professional`
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
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/category/mainCategory`
    );
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getSubCategoriesAction(mainCategoryId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/category/subCategory/${mainCategoryId}`
    );
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getSkillsAction(subCategoryId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/category/skill/${subCategoryId}`
    );
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function getCountriesAction() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/country/countries`
    );
    return await response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

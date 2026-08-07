"use server";

import { getAuthHeaders } from "./tokenAndHeaders.action";

const EMPTY_RESPONSE = {
  status: "400",
  message: "Failed to fetch data",
  response: [],
};

export async function getLanguagesAction() {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/language`,
      {
        cache: "no-store",
        headers,
      }
    );

    if (!response.ok) {
      return {
        ...EMPTY_RESPONSE,
        message: "Failed to fetch languages",
      };
    }

    const data = await response.json();
    return {
      ...EMPTY_RESPONSE,
      ...data,
      response: Array.isArray(data?.response) ? data.response : [],
    };
  } catch (error) {
    console.error(error);
    return {
      ...EMPTY_RESPONSE,
      message: "Failed to fetch languages",
    };
  }
}

export async function getProfessionsAction() {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/private-info/professional`,
      {
        cache: "no-store",
        headers,
      }
    );

    if (!response.ok) {
      return {
        ...EMPTY_RESPONSE,
        message: "Failed to fetch professions",
      };
    }

    const data = await response.json();
    return {
      ...EMPTY_RESPONSE,
      ...data,
      response: Array.isArray(data?.response) ? data.response : [],
    };
  } catch (error) {
    console.error(error);
    return {
      ...EMPTY_RESPONSE,
      message: "Failed to fetch professions",
    };
  }
}

export async function getMainCategoriesAction() {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/category/mainCategory`,
      {
        cache: "no-store",
        headers,
      }
    );

    if (!response.ok) {
      return {
        ...EMPTY_RESPONSE,
        message: "Failed to fetch main categories",
      };
    }

    const data = await response.json();
    return {
      ...EMPTY_RESPONSE,
      ...data,
      response: Array.isArray(data?.response) ? data.response : [],
    };
  } catch (error) {
    console.error(error);
    return {
      ...EMPTY_RESPONSE,
      message: "Failed to fetch main categories",
    };
  }
}

export async function getSubCategoriesAction(mainCategoryId: string) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/category/subCategory/${mainCategoryId}`,
      {
        cache: "no-store",
        headers,
      }
    );

    if (!response.ok) {
      return {
        ...EMPTY_RESPONSE,
        message: "Failed to fetch sub categories",
      };
    }

    const data = await response.json();
    return {
      ...EMPTY_RESPONSE,
      ...data,
      response: Array.isArray(data?.response) ? data.response : [],
    };
  } catch (error) {
    console.error(error);
    return {
      ...EMPTY_RESPONSE,
      message: "Failed to fetch sub categories",
    };
  }
}

export async function getSkillsAction(subCategoryId: string) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/category/skill/${subCategoryId}`,
      {
        cache: "no-store",
        headers,
      }
    );

    if (!response.ok) {
      return {
        ...EMPTY_RESPONSE,
        message: "Failed to fetch skills",
      };
    }

    const data = await response.json();
    return {
      ...EMPTY_RESPONSE,
      ...data,
      response: Array.isArray(data?.response) ? data.response : [],
    };
  } catch (error) {
    console.error(error);
    return {
      ...EMPTY_RESPONSE,
      message: "Failed to fetch skills",
    };
  }
}

export async function getCountriesAction() {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/country/countries`,
      {
        cache: "no-store",
        headers,
      }
    );

    if (!response.ok) {
      return {
        ...EMPTY_RESPONSE,
        message: "Failed to fetch countries",
      };
    }

    const data = await response.json();
    return {
      ...EMPTY_RESPONSE,
      ...data,
      response: Array.isArray(data?.response) ? data.response : [],
    };
  } catch (error) {
    console.error(error);
    return {
      ...EMPTY_RESPONSE,
      message: "Failed to fetch countries",
    };
  }
}

export async function getStatesAction(country: string) {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/country/states/${encodeURIComponent(country)}`,
      {
        cache: "no-store",
        headers,
      }
    );

    if (!response.ok) {
      return {
        ...EMPTY_RESPONSE,
        message: "Failed to fetch states",
      };
    }

    const data = await response.json();
    return {
      ...EMPTY_RESPONSE,
      ...data,
      response: Array.isArray(data?.response) ? data.response : [],
    };
  } catch (error) {
    console.error(error);
    return {
      ...EMPTY_RESPONSE,
      message: "Failed to fetch states",
    };
  }
}

export async function getEthnicAction() {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/private-info/ethnic`,
      {
        cache: "no-store",
        headers,
      }
    );

    if (!response.ok) {
      return {
        ...EMPTY_RESPONSE,
        message: "Failed to fetch ethnicities",
      };
    }

    const data = await response.json();
    return {
      ...EMPTY_RESPONSE,
      ...data,
      response: Array.isArray(data?.response) ? data.response : [],
    };
  } catch (error) {
    console.error(error);
    return {
      ...EMPTY_RESPONSE,
      message: "Failed to fetch ethnicities",
    };
  }
}

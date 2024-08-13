"use server";

// import axiosInstance from "@/lib/config/axiosInstance";

export const getLanguagesAction = async () => {
  //   const userId = "66a86e4be83cd9d78b914b50";
  //   try {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/language/`

    // cache: "force-cache",
  );
  return await response.json();
  //   } catch (error) {
  // console.error(error);
  // return error;
  //   }
};

export const getProfessionsAction = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/private-info/professional/`
    );
    return await response.json();
  } catch {
    return false;
  }
};

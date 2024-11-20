"use server";

export async function getAllNotificationsAction(
  userId: string | undefined,
  pageNo: number,
  pageSize: number
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/notification?userId=${userId}&pageNumber=${pageNo}&pageSize=${pageSize}`
    );

    const res = await response.json();
    if (res.status === "7400") {
      const data = res.response;
      return data;
    } else {
      const data = {
        status: 400,
        message: "Could not fetch all notifications data",
      };
      return data;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

"use server";

import axios from "axios";
import { cookies } from "next/headers";

export async function getAllNotificationsAction(
  userId: string | undefined,
  pageNo: number,
  pageSize: number
) {
  try {
    const token = cookies().get("accessToken")?.value;
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/notification?&pageNumber=${pageNo}&pageSize=${pageSize}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(token, response.data, "notifiaction.action.ts");
    const res = response.data;

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
